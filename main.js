var path = require('path');
var fs = require('fs');
var childProcess = require('child_process');
var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;

var dataBase = { state: 0 };
var dataParse = {
	host: 'http://catalogs.zaptex.ru/chrysler/',
	data: { 
		"2016": {
			path: "c3Q9PTEwfHx5ZWFyPT0yMDE2", data: {}
		}
	}
};

// Получение списка годов для парсинга
var host = dataParse.host;
var hashPath = `#${dataParse.data["2016"].path}`;
var childArgs = [path.join(__dirname, 'utils/parse-years.js'), host, hashPath];
console.log("[Получаем список годов для парсинга]");
console.log("[GET]", `${host}${hashPath}`);

childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {	
	try {
		let yearsUrls = JSON.parse(stdout);
		dataParse.data = Object.assign(dataParse.data, yearsUrls);	
		dataBase.state = 1;

		let arr = [];
		for (let year in dataParse.data) {
			arr.push(year);
		}

		console.log("[Получили список годов для парсинга]", arr);
		console.log("==============================");
	} catch (e) {
		console.log(e);
	}

});

// проверка состояний
var defaultGlobalTaskWatcher = {
	"maxAsync": 10,
	"usage": 0,
	"fullTask": 0,
	"finishedTask": 0,
	"state": "draft",
	"tasks": []
};

var globalTaskWatcher = JSON.parse(JSON.stringify(defaultGlobalTaskWatcher));

var watch = setInterval(function() {
	
	if (dataBase.state === 1) {
		console.log("[Получаем модели по каждому году]");

		for (let year in dataParse.data) {

			globalTaskWatcher.tasks.push({
				arguments: [host, `#${dataParse.data[year].path}`],
				exec: function (url, hashPath) {

					var childArgs = [path.join(__dirname, 'utils/parse-models.js'), url, hashPath];
					console.log("[GET]", url + hashPath);

					childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {

						globalTaskWatcher.state = "draft";
						globalTaskWatcher.finishedTask++;
						console.log("==============================");
						
						try {
							let modelsList = JSON.parse(stdout);
							dataParse.data[year]["data"] = modelsList;
						} catch (e) {
							console.log(e);
						}

					});
				}
			});


		}


		globalTaskWatcher.fullTask = globalTaskWatcher.tasks.length;

		dataBase.state = 1.5;

		var watchTasks = setInterval(function(){
			if (globalTaskWatcher.state === "draft") {
				task = globalTaskWatcher.tasks.shift();
				if (task) {
					var url = 0, hashPath = 1;
					task.exec(task.arguments[url], task.arguments[hashPath]);
					globalTaskWatcher.state = "processing";
				} else if (globalTaskWatcher.finishedTask === globalTaskWatcher.fullTask) {
					globalTaskWatcher.state = "finished";
				}
				
			} else if (globalTaskWatcher.state === "finished") {
				clearInterval(watchTasks);
				dataBase.state = 2;
			}
		}, 1000);


	} else if (dataBase.state === 2) {

		console.log("[Получили список всех моделей]");
		console.log("==============================");
		console.log("[Получаем список комплектующих]");

		globalTaskWatcher = globalTaskWatcher = JSON.parse(JSON.stringify(defaultGlobalTaskWatcher));

		for (let year in dataParse.data) {
			let models = dataParse.data[year]["data"];

			for (let nameModel in models) {
				var ref = models[nameModel];
				var hashPath = `#${models[nameModel].path}`;

				globalTaskWatcher.tasks.push({
					arguments: [host, hashPath, ref],
					exec: function (url, hashPath, referenceModel) {

						var childArgs = [path.join(__dirname, 'utils/parse-complicated.js'), url, hashPath];
						childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {

							globalTaskWatcher.usage--;
							globalTaskWatcher.finishedTask++;

							if (globalTaskWatcher.usage < globalTaskWatcher.maxAsync) {
								globalTaskWatcher.state = "draft";
							}

							try {
								let complect = JSON.parse(stdout);
								referenceModel["data"] = complect;
							} catch (e) {
								console.log(e);
							}

						});
					}
				});
				
			}
		}


		dataBase.state = 2.5;

		globalTaskWatcher.fullTask = globalTaskWatcher.tasks.length;

		console.log("Необходимо выполнить следующее количество задач: ", globalTaskWatcher.fullTask);

		var watchTasks = setInterval(function(){
			if (globalTaskWatcher.state === "draft") {
				task = globalTaskWatcher.tasks.shift();
				if (task) {

					var url = 0, hashPath = 1, reference = 2;
					console.log("[GET]", task.arguments[url] + task.arguments[hashPath], "выполнено", globalTaskWatcher.tasks.length);
					task.exec(task.arguments[url], task.arguments[hashPath], task.arguments[reference]);
					globalTaskWatcher.usage++;

					if (globalTaskWatcher.usage >= globalTaskWatcher.maxAsync) {
						globalTaskWatcher.state = "processing";
					}

					
				} else if (globalTaskWatcher.finishedTask === globalTaskWatcher.fullTask) {
					globalTaskWatcher.state = "finished";
				}
				
			} else if (globalTaskWatcher.state === "finished") {
				clearInterval(watchTasks);
				dataBase.state = 3;

			}
		}, 1000);


	} else if (dataBase.state >= 3) {
		clearInterval(watch);

		var result = JSON.stringify(dataParse, null, 4);
		fs.writeFileSync("data-parse.json", result);
		console.log("==============================");
		console.log("Сгенерирован", "data-parse.json");

	}

}, 1000);


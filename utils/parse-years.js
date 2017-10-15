var system = require('system');
var args = system.args;
var page = require('webpage').create();
page.viewportSize = { width: 1024, height: 768 };
page.clipRect = { top: 0, left: 0, width: 1024, height: 768 };

// params
var host = args[1];
var url = args[1] + args[2];
var yearsXPath = "//*[@id=\"loadpage\"]/table[2]/tbody/tr/td[1]/table/tbody/tr/td/table";
var yearsFilter = ["2015", "2014"];

try {

	page.open(url, function (status) {
		setTimeout(function() {

			var dataBase = page.evaluate(function(evaluateObject) {
				var xPathRes = document.evaluate(evaluateObject.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
				var table = xPathRes.singleNodeValue;
				var data = {};
				var tableRows = table.rows;
				
				for (var i = 0, row; row = xPathRes.singleNodeValue.rows[i]; i++) {
					for (var j = 0, col; col = row.cells[j]; j++) {
						var year = col.innerText;
						if (evaluateObject.years.indexOf(year) > -1) {
							var onclickText = String(col.getAttribute('onclick'));
							if (onclickText !== "null") {
								var regex = /\'(.*?)\'/;
								var strToMatch = onclickText;
								var matched = regex.exec(strToMatch)[1];
								data[year] = {host: evaluateObject.host, path: matched, data: {}};
							}
						}
					}  
				}

				return data;

			}, {
				xpath: yearsXPath,
				years: yearsFilter,
				host: host
			});

			console.log(JSON.stringify(dataBase, null, 4))

			phantom.exit();


		}, 1000);
		

	});

} catch (e) {

	console.log(e);
	phantom.exit();
}

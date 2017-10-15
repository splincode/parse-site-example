var system = require('system');
var args = system.args;
var page = require('webpage').create();
page.viewportSize = { width: 1024, height: 768 };
page.clipRect = { top: 0, left: 0, width: 1024, height: 768 };

// params
var host = args[1];
var url = args[1] + args[2];
var modelsXPath = "//*[@id=\"loadpage\"]/table[2]/tbody/tr/td[2]/div/ul";

try {

	page.open(url, function (status) {
		setTimeout(function() {

			var dataBase = page.evaluate(function(evaluateObject) {
				var xPathRes = document.evaluate(evaluateObject.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
				var ul = xPathRes.singleNodeValue;
				var data = {};

				for (var itemi=0;itemi<ul.childNodes.length;itemi++) {
					var item = ul.childNodes[itemi];
					if (item.nodeName == "LI") {
						var children = item.childNodes;


						for(child in children){
							if (children.hasOwnProperty(child) && children[child] instanceof HTMLElement) {
								var div = children[child];
								var onclickText = String(div.getAttribute('onclick'));

								if (onclickText !== "null") {
									var regex = /\'(.*?)\'/;
									var strToMatch = onclickText;
									var matched = regex.exec(strToMatch)[1];
								}

								var divChildren = div.childNodes;
								for(divChild in divChildren){
									if (divChildren.hasOwnProperty(divChild) && divChildren[divChild] instanceof HTMLElement) {
										var currentDiv = divChildren[divChild];
										var isTitle = currentDiv.getAttribute('name') === "title";
										var title = "";
										if (isTitle) {
											title = currentDiv.innerText;
											data[title] = {path: matched, data: {}};
										}
									}
								}


								for(divChild in divChildren){
									if (divChildren.hasOwnProperty(divChild) && divChildren[divChild] instanceof HTMLElement) {
										var currentDiv = divChildren[divChild];
										var isTitle = currentDiv.getAttribute('name') === "title";
										var title = "";
										if (!isTitle) {
											var imgChildren = currentDiv.childNodes;
											for(imgChild in imgChildren){
												if (imgChildren.hasOwnProperty(imgChild) && imgChildren[imgChild] instanceof HTMLElement) {

													for (var option in data) {
														if (data[option]["path"] === matched) {
															data[option]["img"] = imgChildren[imgChild].src;
														}
													}

												}
											}
										}

									}
								}

							} 
						}
					}
				}

				return data;

			}, {
				xpath: modelsXPath,
				host: host
			});

			console.log(JSON.stringify(dataBase, null, 4))

			phantom.exit();


		}, 5000);


	});

} catch (e) {

	console.log(e);
	phantom.exit();
}

window.onload = function()
{
	initialise();
}

//Initialise page and generate panels
function initialise() {
	//Canvas
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	epsilon = 1;

	//Page properties
	defaultValues = {};
	bleedSize = getProperty("bleed", 5);
	pageWidth = getProperty("pageWidth", 148)+bleedSize*2;
	pageHeight = getProperty("pageHeight", 210)+bleedSize*2;
	insideWidth = getProperty("innerWidth", 125);
	insideHeight = getProperty("innerHeight", 180);
	margin = {x: getProperty("hmargin", 1), y: getProperty("vmargin", 2.6)};
	readingOrderLeft = !(document.getElementById("ro_right")).checked;
	isLeftPage = !(document.getElementById("ps_right")).checked;

	var aspectRatio = pageWidth/pageHeight;
	canvas.height = window.innerHeight*0.9;
	canvas.width = canvas.height*aspectRatio;

	var m = (canvas.height/pageHeight);
	pageWidth *= m;
	pageHeight *= m;
	insideWidth *= m;
	insideHeight *= m;
	bleedSize *= m;
	margin.x *= m;
	margin.y *= m;

	//Page borders
	var xm = (pageWidth-insideWidth)/2;
	var ym = (pageHeight-insideHeight)/2;
	borderMinX = xm;
	borderMaxX = pageWidth-xm;
	borderMinY = ym;
	borderMaxY = pageHeight-ym;

	//Settings
	showReadingOrder = true;
	showPageMargins = true;

	//Panels
	panels = [];
	panels.push(new Panel([
		new Point(xm, ym),
		new Point(pageWidth-xm, ym),
		new Point(pageWidth-xm, pageHeight-ym),
		new Point(xm, pageHeight-ym)
	]));

	//Generation
	generate();

	//Rendering
	render();
}

function getProperty(element, def=0) {
	this.defaultValues[element] = def;
	return parseInt(document.getElementById(element).value);
}

//Presets
function setPresets(data) {
	for (let i=0; i<Object.keys(data).length; i++) {
		var key = Object.keys(data)[i];
		document.getElementById(key).value = data[key];
	}
	initialise();
}

function resetToDefault() {
	setPresets(defaultValues);
}

function shounenStyle() {
	setPresets({
		noOfPanels: 5,
		dynamic: 8,
		vanishing: 2,
		verticalRatio: 3,
		goldenRatio: 3,
		bordering: 3
	})
}

function shoujoStyle() {
	setPresets({
		noOfPanels: 4,
		dynamic: 2,
		vanishing: 7,
		verticalRatio: 4,
		goldenRatio: 7,
		bordering: 8
	})
}

function gagStyle() {
	setPresets({
		noOfPanels: 6,
		dynamic: 0,
		vanishing: 0,
		verticalRatio: 5,
		goldenRatio: 10,
		bordering: 0
	})
}

function doujinStyle() {
	setPresets({
		noOfPanels: 4,
		dynamic: 3,
		vanishing: 5,
		verticalRatio: 4,
		goldenRatio: 5,
		bordering: 8
	})
}

//Apply generation algorithm
function generate() {
	//Generation properties
	val_noOfPanels = getProperty("noOfPanels", 5);
	val_dynamic = getProperty("dynamic", 5)/10;
	val_vanishing = getProperty("vanishing", 5)/10;
	val_verticalRatio = getProperty("verticalRatio", 5)/10;
	val_goldenRatio = getProperty("goldenRatio", 5)/10;
	val_bordering = getProperty("bordering", 5)/10;
	/*panels[0].multiSplit([0.3, 0.5, 0.6, 0.6], true);
	panels[0].setBorders(true, true, true, true);
	panels[1].split(0, 0.1, false);*/

	generationAlgorithm1(val_noOfPanels, val_dynamic, val_vanishing, val_verticalRatio, val_goldenRatio, val_bordering);

}

//Generation algorithm
function generationAlgorithm1(noOfPanels, dynamic, vanishing, verticalRatio, goldenRatio, bordering) {
	var randomFunction = function () {
		if (Math.random() > goldenRatio)
			return randomRange(0.5-dynamic*0.45, 0.5+dynamic*0.45);
		else
			return selectRandom([0.618, 0.5, 1-0.618]);
	}

	//Generate panels
	var tries = 0;
	while (panels.length < noOfPanels && tries++<1000) {
		var panelHeuristics = [];
		//Prioritise which panel to split
		for (var i=0; i<panels.length; i++) {
			var heuristic = panels[i].getArea();
			panelHeuristics.push({n: i, w: heuristic});
		}

		//Split panels
		var index = weightedRandom(panelHeuristics);
		var panel = panels[index];
		var isHorizontal = (Math.random()>verticalRatio);
		var n1 = randomFunction();
		var n2 = randomFunction();
		if (Math.random() > dynamic)
			n1 = n2;
		panel.split(n1, n2, isHorizontal);
	}

	//Apply other characteristics (ie. vanishing panels, bordering)
	for (var i=0; i<panels.length; i++) {
		panels[i].setVisible(Math.pow(Math.random(), 0.375) > vanishing);
		panels[i].setBordersDynamic(
			Math.random() < bordering,
			Math.pow(Math.random()*dynamic, 2) > 0.5,
			Math.random() < bordering,
			Math.pow(Math.random()*dynamic, 2) > 0.5,
			Math.random() < bordering,
			Math.pow(Math.random()*dynamic, 2) > 0.5,
			Math.random() < bordering,
			Math.pow(Math.random()*dynamic, 2) > 0.5
		);
	}
}

//Render panels to screen
function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#ffffff";
	ctx.beginPath();
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.stroke();

	//Render panels
	var panelNumber = 0;
	for (let i=0; i<panels.length; i++) {
		panels[i].render();
	}

	//Show reading order
	if (showReadingOrder) {
		ctx.font = "17px Arial";
		ctx.textAlign = (readingOrderLeft ? "right" : "left");
		var panelNumber = 0;
		for (let i=0; i<panels.length; i++) {
			var panel = panels[i];
			if (!(i > 0 && !panel.visible && !panels[i - 1].visible) && panels[i].countPanel) {
				var points = panel.getRenderPoints();
				panelNumber++;
				//panelNumber = panel.getArea();
				ctx.fillStyle = "#000000";
				if (readingOrderLeft)
					ctx.fillText(panelNumber.toString() + ".", points[1].x - 10, points[1].y + 25);
				else
					ctx.fillText(panelNumber.toString() + ".", points[0].x + 10, points[0].y + 25);
			}
		}
	}

	//Show page margins
	if (showPageMargins) {
		ctx.strokeStyle = "#8888ff";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.rect((pageWidth - insideWidth) / 2, (pageHeight - insideHeight) / 2, insideWidth, insideHeight);
		ctx.rect(bleedSize, bleedSize, pageWidth - bleedSize * 2, pageHeight - bleedSize * 2);
		ctx.stroke();
	}
}

//Panel object
function Panel(points) {
	this.points = points;
	this.borders = new Borders(false, false, false, false);
	this.visible = true;
	this.hasSplit = false;
	this.margin = margin;
	this.countPanel = true;

	//Perform the split between panels
	this.split = function (startRatio, endRatio, isHorizontal) {
		this.hasSplit = true;

		//Horizontal split ---
		if (isHorizontal) {
			var _x2 = this.points[2].x;
			var _y2 = this.points[2].y;
			var _x3 = this.points[3].x;
			var _y3 = this.points[3].y;
			this.points[2].x = lerp(this.points[1].x, this.points[2].x, endRatio);
			this.points[2].y = lerp(this.points[1].y, this.points[2].y, endRatio);
			this.points[3].x = lerp(this.points[0].x, this.points[3].x, startRatio);
			this.points[3].y = lerp(this.points[0].y, this.points[3].y, startRatio);

			var newPanel = new Panel([
				new Point(this.points[3].x, this.points[3].y),
				new Point(this.points[2].x, this.points[2].y),
				new Point(_x2, _y2),
				new Point(_x3, _y3),

			]);
			//Sort by reading order
			var index = panels.indexOf(this);
			panels.splice(index+1, 0, newPanel);
		}

		//Vertical split |||
		else {
			var _x1 = this.points[1].x;
			var _y1 = this.points[1].y;
			var _x2 = this.points[2].x;
			var _y2 = this.points[2].y;
			this.points[1].x = lerp(this.points[0].x, this.points[1].x, endRatio);
			this.points[1].y = lerp(this.points[0].y, this.points[1].y, endRatio);
			this.points[2].x = lerp(this.points[3].x, this.points[2].x, startRatio);
			this.points[2].y = lerp(this.points[3].y, this.points[2].y, startRatio);

			var newPanel = new Panel([
				new Point(this.points[1].x, this.points[1].y),
				new Point(_x1, _y1),
				new Point(_x2, _y2),

				new Point(this.points[2].x, this.points[2].y),
			]);

			var index = panels.indexOf(this);

			//Sort by reading order
			if (readingOrderLeft)
				panels.splice(index, 0, newPanel)
			else
				panels.splice(index+1, 0, newPanel)
		}

		return newPanel;
	}

	//Multi-split (split panel multiple times with multiple ratioa)
	this.multiSplit = function(ratios, isHorizontal, total0=0, total1=0) {
		if (!ratios.length)
			return;

		var newRatios = [];
		var total0 = total0;
		var total1 = total1;

		newRatios.push((ratios[0]-total0)/(1-total0));
		newRatios.push((ratios[1]-total1)/(1-total1));
		total0 = ratios[0];
		total1 = ratios[1];

		var newPanel = this.split(newRatios[0], newRatios[1], isHorizontal);
		ratios.shift();
		ratios.shift();
		newPanel.multiSplit(ratios, isHorizontal, total0, total1);
	}

	//Set borders (whether it extends past the page or not)
	//borders 'true' means it does extend the page
	this.setBorders = function(left, up, right, down) {

		//Certain restrictions prevent the panel from bordering, if:
		//-The panel is not at the edge of the inside page in that direction
		if (points[0].x !== borderMinX || points[3].x !== borderMinX)
			left = false;
		if (points[1].x !== borderMaxX || points[2].x !== borderMaxX)
			right = false;
		if (points[0].y !== borderMinY || points[1].y !== borderMinY)
			up = false;
		if (points[2].y !== borderMaxY || points[3].y !== borderMaxY)
			down = false;

		//-Bordering would cause the panel to extend into the gutter
		if (isLeftPage)
			right = false;
		else
			left = false;

		this.borders.left = left;
		this.borders.up = up;
		this.borders.right = right;
		this.borders.down = down;

		//Apply borders
		if (this.borders.left) {
			this.points[0].y += (this.points[1].y-this.points[0].y)*(this.points[0].x/(this.points[0].x-this.points[1].x));
			this.points[0].x = 0;
			this.points[3].y += (this.points[3].y-this.points[2].y)*(this.points[3].x/(this.points[2].x-this.points[3].x));
			this.points[3].x = 0;
		}
		if (this.borders.up) {
			this.points[0].x += (this.points[3].x-this.points[0].x)*(this.points[0].y/(this.points[0].y-this.points[3].y));
			this.points[0].y = 0;
			this.points[1].x += (this.points[1].x-this.points[2].x)*(this.points[1].y/(this.points[2].y-this.points[1].y));
			this.points[1].y = 0;
		}
		if (this.borders.right) {
			this.points[1].y += (this.points[0].y-this.points[1].y)*((canvas.width-this.points[1].x)/(this.points[0].x-this.points[1].x));
			this.points[1].x = canvas.width;
			this.points[2].y += (this.points[3].y-this.points[2].y)*((canvas.width-this.points[2].x)/(this.points[3].x-this.points[2].x));
			this.points[2].x = canvas.width;
		}
		if (this.borders.down) {
			this.points[2].x += (this.points[1].x-this.points[2].x)*((canvas.height-this.points[2].y)/(this.points[1].y-this.points[2].y));
			this.points[2].y = canvas.height;
			this.points[3].x += (this.points[0].x-this.points[3].x)*((canvas.height-this.points[3].y)/(this.points[0].y-this.points[3].y));
			this.points[3].y = canvas.height;
		}
	}

	//setBordersDynamic only moves one of the points
	this.setBordersDynamic = function(left, leftRandom, up, upRandom, right, rightRandom, down, downRandom) {

		//Certain restrictions prevent the panel from bordering, if:
		//-The panel is not at the edge of the inside page in that direction
		if (points[0].x !== borderMinX || points[3].x !== borderMinX)
			left = false;
		if (points[1].x !== borderMaxX || points[2].x !== borderMaxX)
			right = false;
		if (points[0].y !== borderMinY || points[1].y !== borderMinY)
			up = false;
		if (points[2].y !== borderMaxY || points[3].y !== borderMaxY)
			down = false;

		//-Bordering would cause the panel to extend into the gutter
		if (isLeftPage)
			right = false;
		else
			left = false;

		this.borders.left = left;
		this.borders.up = up;
		this.borders.right = right;
		this.borders.down = down;

		//Apply borders
		if (this.borders.left) {
			if (!leftRandom || Math.random() > 0.5) {
				this.points[0].y += (this.points[1].y - this.points[0].y) * (this.points[0].x / (this.points[0].x - this.points[1].x));
				this.points[0].x = 0;
			}
			if (!leftRandom || Math.random() > 0.5) {
				this.points[3].y += (this.points[3].y - this.points[2].y) * (this.points[3].x / (this.points[2].x - this.points[3].x));
				this.points[3].x = 0;
			}
		}
		if (this.borders.up) {
			if (!upRandom || Math.random() > 0.5) {
				this.points[0].x += (this.points[3].x - this.points[0].x) * (this.points[0].y / (this.points[0].y - this.points[3].y));
				this.points[0].y = 0;
			}
			if (!upRandom || Math.random() > 0.5) {
				this.points[1].x += (this.points[1].x - this.points[2].x) * (this.points[1].y / (this.points[2].y - this.points[1].y));
				this.points[1].y = 0;
			}
		}
		if (this.borders.right) {
			if (!rightRandom || Math.random() > 0.5) {
				this.points[1].y += (this.points[0].y - this.points[1].y) * ((canvas.width - this.points[1].x) / (this.points[0].x - this.points[1].x));
				this.points[1].x = canvas.width;
			}
			if (!rightRandom || Math.random() > 0.5) {
				this.points[2].y += (this.points[3].y - this.points[2].y) * ((canvas.width - this.points[2].x) / (this.points[3].x - this.points[2].x));
				this.points[2].x = canvas.width;
			}
		}
		if (this.borders.down) {
			if (!downRandom || Math.random() > 0.5) {
				this.points[2].x += (this.points[1].x - this.points[2].x) * ((canvas.height - this.points[2].y) / (this.points[1].y - this.points[2].y));
				this.points[2].y = canvas.height;
			}
			if (!downRandom || Math.random() > 0.5) {
				this.points[3].x += (this.points[0].x - this.points[3].x) * ((canvas.height - this.points[3].y) / (this.points[0].y - this.points[3].y));
				this.points[3].y = canvas.height;
			}
		}
	}

	//Set visible
	this.setVisible = function(visible) {
		this.visible = visible;
	}

	//Get area of panel
	this.getArea = function() {
		var lengths = [];
		var semiPerimeter = 0;
		for (var i=0; i<points.length; i++) {
			var j = (i+1)%points.length;
			var distance = Math.sqrt(Math.pow((points[i].x-points[j].x)/canvas.width,2)+Math.pow((points[i].y-points[j].y)/canvas.height,2));
			lengths.push(distance);
			semiPerimeter += distance/2;
		}

		var value = 1;
		for (var i=0; i<points.length; i++) {
			value *= (semiPerimeter-lengths[i]);
		}
		return Math.sqrt(value);
	}

	//Get points after considering the margins
	this.getRenderPoints = function() {
		var marginPoints = [];
		for (var i=0; i<this.points.length; i++)
			marginPoints.push(new Point(this.points[i].x, this.points[i].y));

		if (!getEqualsWE(this.points[0].x, 0, borderMinX))
			marginPoints[0].x = this.points[0].x+this.margin.x;
		if (!getEqualsWE(this.points[0].y, 0, borderMinY))
			marginPoints[0].y = this.points[0].y+this.margin.y;

		if (!getEqualsWE(this.points[1].x, canvas.width, borderMaxX))
			marginPoints[1].x = this.points[1].x-this.margin.x;
		if (!getEqualsWE(this.points[1].y, 0, borderMinY))
			marginPoints[1].y = this.points[1].y+this.margin.y;

		if (!getEqualsWE(this.points[2].x, canvas.width, borderMaxX))
			marginPoints[2].x = this.points[2].x-this.margin.x;
		if (!getEqualsWE(this.points[2].y, canvas.height, borderMaxY))
			marginPoints[2].y = this.points[2].y-this.margin.y;

		if (!getEqualsWE(this.points[3].x, 0, borderMinX))
			marginPoints[3].x = this.points[3].x+this.margin.x;
		if (!getEqualsWE(this.points[3].y, canvas.height, borderMaxY))
			marginPoints[3].y = this.points[3].y-this.margin.y;

		return marginPoints;
	}

	//Render
	this.render = function() {
		ctx.lineWidth = 2;
		ctx.beginPath();

		var points = this.getRenderPoints();
		if (this.visible) {
			ctx.strokeStyle = "#000000";
			ctx.fillStyle = "#ffffff";

			ctx.moveTo(points[0].x, points[0].y);
			for (var n = 1; n < points.length; n++) {
				ctx.lineTo(points[n].x, points[n].y);
			}

			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		}
	}

}

//Point object
function Point(x, y) {
	this.x = x;
	this.y = y;
}

//Borders object
function Borders(left, up, right, down) {
	this.left = left;
	this.right = right;
	this.left = up;
	this.right = down;
}

//Random range between a and b
function randomRange(a, b) {
	return Math.random()*(b-a)+a;
}

//Select random between arrya
function selectRandom(array) {
	return array[Math.floor(Math.random()*array.length)];
}

//Weighted random
function weightedRandom(data) {
	total = 0;
	for (let i=0; i<data.length; i++) {
		total += data[i].w;
	}
	num = randomRange(0, total);
	for (let i=0; i<data.length; i++) {
		num -= data[i].w;
		if (num <= 0)
			return data[i].n;
	}
	return data[data.length-1].n;
}

//Lerp between start and end with amount
function lerp(s, e, a) {
	return (1-a)*s+a*e;
}

//Get if a value is equal to one of two values (with epsilon)
function getEqualsWE(a, b, c) {
	return Math.abs(a-b)<epsilon || Math.abs(a-c)<epsilon;
}
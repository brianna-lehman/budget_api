var categories;
var purchases;

function setup() {
	console.log("setting up page");
	getCategories();
}

function makeReq(method, target, retCode, action, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		console.log('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, action);
	httpRequest.open(method, target);

	if (data){
		httpRequest.setRequestHeader('Content-Type', 'application/json');
		httpRequest.send(JSON.stringify(data));
	}
	else {
		httpRequest.send();
	}
}

function makeHandler(httpRequest, retCode, action) {
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("recieved response text:  " + httpRequest.responseText + ", " + typeof JSON.parse(httpRequest.responseText));
				action(JSON.parse(httpRequest.responseText));
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}

function addCategory() {
	// get category name and limit from form
	// put in json data file
	var name = document.getElementById("catName").value;
	var limit = parseInt(document.getElementById("catLim").value);
	var data = {};
	data['name'] = name;
	data['limit'] = limit;
	makeReq("POST", "/cats", 200, reset, data);
}

function deleteCategory() {
	// get category name from radio buttons form
	// put in json data file
	var delCategory = getCheckedCategory('delCat');
	var data = {};
	data['name'] = delCategory.value;
	data['limit'] = -1;
	console.log("deleteCategory: "+data);
	makeReq("DELETE", "/cats", 200, reset, data);
}

function addPurchase() {
	// get name, amount, date, category from form
	// put in json data file
	var form = document.getElementById("addPurch").elements;
	var data = {};
	var amount = form.item(0);
	data['amount'] = amount.value;
	var name = form.item(1);
	data['name'] = name.value;
	var category = getCheckedCategory('purCat');
	data['category'] = category.value;
	var date = form.item(2);
	data['date'] = date.value;
	makeReq("POST", "/purchases", 200, reset, data);
}

function getCheckedCategory(element_name) {
	var categories_list = document.getElementsByClassName(element_name);
	if (categories_list.length !== 0) {
		for (var i = 0; i < categories_list.length; i++) {
			if (categories_list[i].checked) {
				return categories_list[i];
			}
		}
		return categories_list[0];
	}
	else {
		return "";
	}
}

function generatePage() {
	console.log("generating page");

	budgetData = document.getElementById("budgetData");
	dataBlock = document.createElement("div");
	dataBlock.setAttribute('id', 'data');

	createFormList("addPurch");
	createFormList("deleteCat");

	purch_data = Object.values(purchases);
	var date = new Date();

	for (var category in categories) {
		if (!categories.hasOwnProperty(category)) {
			continue;
		}

		var category_purchases = categoryFilter(category, purch_data, date);
		var c = categories[category];

		var purchases_amount = category_purchases.map(function(item, i) {
			return item.amount;
		}, 0);

		var total_spent = purchases_amount.reduce(function(acc, curr) {
			return acc + curr;
		}, 0);

		// creating the header
		// var dataBlock = document.getElementById("budgetData");
		var h3 = document.createElement("h3");
		var limit = parseFloat(c.limit);
		var h3_txt = document.createTextNode(c.name+": $"+total_spent.toFixed(2)+"/$"+limit.toFixed(2));
		h3.appendChild(h3_txt);
		dataBlock.appendChild(h3);

		if (total_spent > limit && c.name !== "uncategorized") {
			var over_budget = document.createElement("div");
			var over_budget_message = document.createTextNode("You've gone over budget for this category");
			over_budget.appendChild(over_budget_message);
			dataBlock.appendChild(over_budget);
			dataBlock.appendChild(document.createElement("br"));
		}

		// printing "no purchases" message instead of table
		if (category_purchases.length === 0) {
			var no_table = document.createElement("div");
			var no_table_message = document.createTextNode("There are no purchases under this category");
			no_table.appendChild(no_table_message);
			dataBlock.appendChild(no_table);
			continue;
		}

		// printing table of purchases
		var purchasesTable = document.createElement("table");
		var tblBody = document.createElement("tbody");
		var labels = ["name", "amount", "date"];

		var headerRow = document.createElement("tr");

		for (var k = 0; k < labels.length; k++) {
			var headerCell = document.createElement("th");
			var headerCellTxt = document.createTextNode(labels[k]);
			headerCell.appendChild(headerCellTxt);
			headerRow.appendChild(headerCell);
		}

		tblBody.appendChild(headerRow);

		// create a row for every purchase under this category
		for (var i = 0; i < category_purchases.length; i++) {

			var row = document.createElement("tr");
			var currentPurchase = category_purchases[i];

			for (var k = 0; k < labels.length; k++) {
				var key = labels[k];
				var cell = document.createElement("td");
				var cellTxt = document.createTextNode(currentPurchase[key]);
				cell.appendChild(cellTxt);
				row.appendChild(cell);
			}

			tblBody.appendChild(row);
		}

		purchasesTable.appendChild(tblBody);
		dataBlock.appendChild(purchasesTable);
	}

	budgetData.appendChild(dataBlock);
}

function categoryFilter(cat, purchase_data, date) {
	return purchase_data.filter(function(item, i) {
		var purch_date = new Date(item.date);
		if (purch_date.getMonth() === date.getMonth() && purch_date.getYear() === date.getYear()) {
			return item.category === cat;
		}
	}, 0);
}

function reset() {
	console.log("resetting");
	purCatList = document.getElementById("purCatList");
	purCatList.parentNode.removeChild(purCatList);
	delCatList = document.getElementById("delCatList");
	delCatList.parentNode.removeChild(delCatList);
	data = document.getElementById("data");
	data.parentNode.removeChild(data);
	// document.getElementById("deleteCat").reset();
	// document.getElementById("budgetData").reset();
	getCategories();
}

function createFormList(element_id) {

	var form = document.getElementById(element_id);
	var div = document.createElement("div");
	if (element_id === 'deleteCat') { div.setAttribute('id', 'delCatList'); }
	if (element_id === 'addPurch') { div.setAttribute('id', 'purCatList'); }
	for (var c in categories) {
		if (categories.hasOwnProperty(c)) {
			var cat_data = categories[c];
			var newInput = document.createElement("input");
			newInput.setAttribute('type', 'radio');
			newInput.setAttribute('name', 'category');
			if (element_id === 'deleteCat') { newInput.setAttribute('class', 'delCat'); }
			if (element_id === 'addPurch') { newInput.setAttribute('class', 'purCat'); }
			newInput.setAttribute('value', cat_data.name);
			div.appendChild(newInput);
			val = document.createTextNode(cat_data.name);
			br = document.createElement("br");
			div.appendChild(val);
			div.appendChild(br);
		}
	}
	var input = document.createElement("button");
	input.setAttribute('type', 'button');

	if (element_id === "deleteCat") {
		input.setAttribute('onclick', 'deleteCategory()');
		input.setAttribute('class', 'delCat');
		input.appendChild(document.createTextNode('Delete Category'));
	}
	if (element_id === "addPurch") {
		input.setAttribute('onclick', 'addPurchase()');
		input.setAttribute('class', 'purCat');
		input.appendChild(document.createTextNode("Add Purchase"));
	}

	div.appendChild(input);
	form.appendChild(div);

}

function getCategories() {
	console.log("get categories");
	makeReq("GET", "/cats", 200, setCategories);
}

function setCategories(list_of_categories) {
	categories = list_of_categories;
	console.log("get purchases");
	makeReq("GET", "/purchases", 200, setPurchases);
}

function setPurchases(list_of_purchases) {
	purchases = list_of_purchases;
	generatePage()
}

window.addEventListener("load", setup, true);
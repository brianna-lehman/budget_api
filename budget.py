from flask_restful import reqparse, abort, fields, marshal_with, Api, Resource
from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash, _app_ctx_stack
import json

app = Flask(__name__)
api = Api(app)

cat_parser = reqparse.RequestParser()
cat_parser.add_argument('name', type=str, location='json')
cat_parser.add_argument('limit', type=str, location='json')

purchase_parser = reqparse.RequestParser()
purchase_parser.add_argument('amount', type=float, location='json')
purchase_parser.add_argument('name', type=str, location='json')
purchase_parser.add_argument('category', type=str, location='json')
# can type be specified as date?
purchase_parser.add_argument('date', type=str, location='json')

cat_name_count = {}
purch_name_count = {}

categories = {
	'uncategorized': {'name': 'uncategorized', 'limit': 0},
	'food': {'name': 'food', 'limit': '100'},
	'pet': {'name': 'pet', 'limit': '1000000'}
}

purchases = {
	'groceries1': {'name':'groceries1', 'amount':10.43, 'date':'2017-11-23', 'category':'food'},
	'groceries2': {'name':'groceries2', 'amount':100.43, 'date':'2017-12-25', 'category':'food'},
	'groceries3': {'name':'groceries3', 'amount':1.43, 'date':'2017-12-05', 'category':'food'},
	'cat food': {'name': 'cat food', 'amount':50, 'date':'2017-02-12', 'category': 'pet'}
}

@app.route("/")
def root_page():
	return render_template("page.html")

class Categories(Resource):
	# get list of budget categories
	def get(self):
		return categories, 200

	# given a category name and limit
	# add a new category
	def post(self):
		args = cat_parser.parse_args()
		print(args)
		label = args['name']

		# if the name of the category is already in use
		# find the number of times it's been used
		# and create the label as name# with # being one more
		# than the number of times this category name has been used before
		if label in categories.keys():
			num = cat_name_count[label] + 1
			cat_name_count[label] = num
			label += str(num)
		else:
			cat_name_count[label] = 1

		categories[label] = {'name': args['name'], 'limit': args['limit']}
		print(categories)
		return '', 200

	# given a category name
	# delete a category
	def delete(self):
		args = cat_parser.parse_args()
		cat_name = args['name']
		for name,values in purchases.items():
			if values['category'] == cat_name:
				values['category'] = 'uncategorized'
		del categories[cat_name]
		return '', 200

class Purchases(Resource):
	# get list of all purchases
	def get(self):
		# possibly jsonify this list
		return purchases, 200

	# given an amount, name, category, and date
	# add a new purchase
	def post(self):
		args = purchase_parser.parse_args()
		print(args)
		purchase = {'amount': args['amount'], \
					'category': args['category'], \
					'date': args['date'], \
					'name': args['name']}

		label = args['name']
		if label in purchases.keys():
			num = purch_name_count[label] + 1
			purch_name_count[label] = num
			label = args['name'] + str(num)
		else:
			purch_name_count[label] = 1

		purchases[args['name']] = purchase
		print(purchases)
		return purchase, 200

api.add_resource(Categories, '/cats')
api.add_resource(Purchases, '/purchases')

if __name__ == '__main__':
	app.run(debug=True)
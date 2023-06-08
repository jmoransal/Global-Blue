{
	"name": "TaxFree for Odoo by GlobalBlue",
	"summary": """""",
	"category": "Sales",
	"version": "2.0.0",
	"sequence": 1,
	"author": "GlobalBlue",
    'maintainer': 'ProcessControl S.C.C.L',
	"license": "OPL-1",
	"website": "",
	"description": """""",
	"depends": [
		'sale',
		'point_of_sale'
	],
	"qweb": [
		'static/src/xml/ReceiptScreen/ReceiptScreen.xml',
		'static/src/xml/PaymentScreen/PaymentScreen.xml',
	],
	"data": [
		"views/assets.xml",
		'views/res_config_settings.xml',
		'views/pos_order.xml',
		'wizard/pos_payment.xml',
	],
    # Odoo Store Specific
    'images': [
        'static/description/thumbail_odoo.png',
    ],
	"assets": {
		# "point_of_sale.assets": [
		#     "pc_tax_free/static/src/js/**/*.js",
		# ],
		"web.assets_qweb": [
			"pc_tax_free/static/src/xml/**/*.xml",
		],
	},

    # Technical
	"application": True,
    'installable': True,
    'auto_install': False,
    'price': 0.00,
    'currency': 'EUR',
}

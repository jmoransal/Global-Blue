# -*- coding: utf-8 -*-
import logging

from odoo import api, fields, models, tools, _
import json
import requests
from odoo.http import request

_logger = logging.getLogger(__name__)


class ProductProduct(models.Model):
	_inherit = "product.product"

	tax_amount = fields.Float(string="Tax Amount", compute="_compute_get_tax")

	def _compute_get_tax(self):
		tax = 0
		for product in self:
			if product:
				if product.taxes_id:
					tax = product.taxes_id.amount
				product.tax_amount = tax

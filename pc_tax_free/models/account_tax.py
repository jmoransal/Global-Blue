# -*- coding: utf-8 -*-
import logging

from odoo import api, fields, models, tools, _
import json
import requests
from odoo.http import request

_logger = logging.getLogger(__name__)


class AccountTax(models.Model):
	_inherit = "account.tax"

	@api.model
	def GetTaxNumber(self):
		taxes_dict = []
		taxes = self.env['account.tax'].search([])
		if taxes:
			for t in taxes:
				taxes_dict.append({
					'id': t.id,
					'amount': t.amount,
				})

		return json.dumps(taxes_dict)


# -*- coding: utf-8 -*-
import logging

from odoo import api, fields, models, tools, _
import json
import requests
from odoo.http import request

_logger = logging.getLogger(__name__)


class Company(models.Model):
	_inherit = "res.company"

	api_url = fields.Char(string="API URL", readonly=False)
	api_user = fields.Char(string="API User", readonly=False)
	api_pass = fields.Char(string="API Password", readonly=False)
	ic2_integra_url = fields.Char(string="IC2 Integra Url", readonly=False)
	dev_mode = fields.Boolean(string="Dev mode", readonly=False)

	@api.model
	def UserAuthenticationRequestSessionToken(self, pos_id):
		if pos_id:
			url_segment = "UserAuthentication/RequestSessionToken"
			pos = self.env['pos.config'].search([('id', '=', pos_id)])
			if pos:
				company = pos.company_id
				if company.dev_mode:
					api_url = "https://ic2integra-web.mspe.globalblue.com/service/api/" + url_segment
				else:
					api_url = company.api_url + url_segment
				api_user = company.api_user
				# api_user = "bkbsdbfhs"
				api_pass = company.api_pass
				myobj = {
					'Username': api_user,
					'Password': api_pass,
					'TokenLifetime': 3600,
				}

				x = requests.post(api_url, json=myobj)
				_logger.error("*******OBJETO TOKEN********")
				_logger.error(x)
				_logger.error(x.text)
				if x.text:
					json_object = json.loads(x.text)
					if 'Token' in json_object:
						request.session['tokenTaxFree'] = json_object['Token']
						return json_object['Token']
					else:
						return False
				else:
					return False
		return False

	@api.model
	def getApiMode(self, pos_id):
		if pos_id:
			pos = self.env['pos.config'].search([('id', '=', pos_id)])
			if pos:
				company = pos.company_id
				if company:
					if company.dev_mode:
						return "dev"
					else:
						return "prod"
		return False

	@api.model
	def getIssuePostUrlProd(self, pos_id):
		if pos_id:
			pos = self.env['pos.config'].search([('id', '=', pos_id)])
			if pos:
				company = pos.company_id
				if company:
					if company.ic2_integra_url:
						return company.ic2_integra_url
					else:
						return "https://ic2integra.globalblue.com/ui/integra/"
		return "https://ic2integra.globalblue.com/ui/integra/"

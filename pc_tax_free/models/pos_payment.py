# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo.exceptions import UserError
import requests
import json
from odoo.http import request


class PosMakePayment(models.TransientModel):
	_inherit = 'pos.make.payment'

	def _default_amount_total(self):
		active_id = self.env.context.get('active_id')
		if active_id:
			order = self.env['pos.order'].browse(active_id)
			return order.amount_total - order.amount_paid
		return False

	def _default_amount_untaxed(self):
		active_id = self.env.context.get('active_id')
		if active_id:
			order = self.env['pos.order'].browse(active_id)
			return order.amount_total - order.amount_tax
		return False

	def _default_get_doc_id_freetax(self):
		active_id = self.env.context.get('active_id')
		if active_id:
			order = self.env['pos.order'].browse(active_id)
			return order.document_identifier_integra
		return False

	def _default_get_total_gross_amount(self):
		active_id = self.env.context.get('active_id')
		if active_id:
			order = self.env['pos.order'].browse(active_id)
			return order.totalGrossAmount
		return False

	def _default_get_pos_order(self):
		active_id = self.env.context.get('active_id')
		if active_id:
			order = self.env['pos.order'].browse(active_id)
			return order.id
		return False

	amount_total = fields.Float(digits=0, required=True, default=_default_amount_total)
	amount_untaxed = fields.Float(digits=0, required=True, default=_default_amount_untaxed)
	document_identifier_integra = fields.Char(digits=0, default=_default_get_doc_id_freetax)
	totalGrossAmount = fields.Char(digits=0, default=_default_get_total_gross_amount)
	pos_order_for_tax = fields.Many2one('pos.order', default=_default_get_pos_order)

	def check(self):
		if self.pos_order_for_tax.tff_void == True:
			raise UserError("It is not possible to continue, the tax free has been returned.")
		if self.document_identifier_integra:
			url_segment = "TfsIssuingService/VoidCheque"
			company = self.env.company
			api_url = company.api_url + url_segment
			token = self.getTokenPaymentTaxFree()
			if token:
				headers = {'GB-SessionToken': token}
				data_post = {'TotalGrossAmount': self.totalGrossAmount,
							 'DocIdentifier': self.document_identifier_integra}
				# data_post = {'TotalGrossAmount': abs(self.amount_untaxed),'DocIdentifier': "11003099104153013219"}
				resp = requests.post(api_url, data=data_post, headers=headers)
				if resp.status_code == 403:
					self.error_process_taxfree = True
					self.message_control_refund_taxfree = "An error has occurred in the Freetax system, please try again or contact technical support."
					raise UserError(
						"An error has occurred in the Freetax system, please try again or contact technical support.")
				if resp.status_code == 200:
					resp_ = json.loads(resp.text)
					if resp_['VoidSuccessful'] == False:
						self.pos_order_for_tax.error_process_taxfree = True
						self.pos_order_for_tax.message_control_refund_taxfree = resp_['ResultMessage']
						raise UserError(self.pos_order_for_tax.message_control_refund_taxfree)
					if resp_['VoidSuccessful'] == True:
						self.pos_order_for_tax.error_process_taxfree = False
						self.pos_order_for_tax.tff_void = True
						self.pos_order_for_tax.message_control_refund_taxfree = resp_['ResultMessage']
			# Esta alerta ponerla solo cuando el freetax este cobrado, cuando es 403 ponemos un error normal
			# raise UserError("You cannot continue with the return. The freetax has already been charged.")
		return super().check()

	def getTokenPaymentTaxFree(self):
		token = False
		url_segment = "UserAuthentication/RequestSessionToken"
		company = self.env.company
		if company:
			api_url = company.api_url + url_segment
			api_user = company.api_user
			api_pass = company.api_pass
			myobj = {
				'Username': api_user,
				'Password': api_pass,
				'TokenLifetime': 3600,
			}

			x = requests.post(api_url, json=myobj)
			if x.text:
				json_object = json.loads(x.text)
			if 'Token' in json_object:
				request.session['tokenTaxFree'] = json_object['Token']
				token = json_object['Token']
		return token

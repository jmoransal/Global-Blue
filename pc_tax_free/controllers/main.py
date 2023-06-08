# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.

import logging
from odoo import http
from odoo.http import request
import json

_logger = logging.getLogger("POS Controller")


class Main(http.Controller):

	@http.route(['/web/save_integra'], csrf=False, auth="public", type="http", method=['POST'])
	def save_integra(self, **post):
		if post:
			pos_reference = post.get('shopInvoiceNumber')
			if pos_reference:
				pos_order = request.env['pos.order'].sudo().search([('pos_reference', '=', pos_reference)], limit=1)
				if pos_order:
					if post.get('pdf'):
						pos_order.sudo().write({
							'pdf_base64_integra': post.get('pdf'),
							'document_identifier_integra': post.get('document_identifier'),
							'totalGrossAmount': post.get('totalGrossAmount'),
							'tff_void': False
						})
		# 			return True
		# return False

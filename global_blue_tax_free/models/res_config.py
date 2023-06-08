# -*- coding: utf-8 -*-
"""
    This model is used to create a boolean social sharing options.
"""
import base64
from odoo import fields, models, tools, api, _
from odoo.modules.module import get_resource_path
from odoo.addons.website.tools import get_video_embed_code


class res_config(models.TransientModel):
	_inherit = "res.config.settings"

	api_url = fields.Char(string="API URL", related='company_id.api_url', readonly=False)
	api_user = fields.Char(string="API User", related='company_id.api_user', readonly=False)
	api_pass = fields.Char(string="API Password", related='company_id.api_pass', readonly=False)
	ic2_integra_url = fields.Char(string="IC2 Integra Url", related="company_id.ic2_integra_url", readonly=False)
	dev_mode = fields.Boolean(string="Dev mode", related="company_id.dev_mode", readonly=False)

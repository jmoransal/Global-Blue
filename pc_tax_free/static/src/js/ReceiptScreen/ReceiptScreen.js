odoo.define("pc_tax_free.ReceiptScreen", function (require) {
    "use strict";

    const { useRef, useContext } = owl.hooks;
    const ReceiptScreen = require("point_of_sale.ReceiptScreen");
    const Registries = require("point_of_sale.Registries");
    const PosModel = require("point_of_sale.models");
    const { isRpcError } = require('point_of_sale.utils');
    var core = require('web.core');
    var session = require('web.session');

    var models = require('point_of_sale.models');
    let pdf_free_tax_receipt_for_printer = "";
    let api_mode = "dev";
    let prod_issueposturl = "https://ic2integra.globalblue.com/ui/integra/";
	models.load_fields('product.product', ['tax_amount']);
	models.load_fields('pos.order', ['pdf_base64_integra']);

//	var publicWidget = require('web.public.widget');

//	publicWidget.registry.PaymentForm = publicWidget.Widget.extend({
//		events: {
//			'click #test': 'payEvente',
//		},
//    	payEvente: function (ev) {
//        	ev.preventDefault();
//        	console.log("payEVENT")
//        },
//    });

//   	PosModel.load_files('res.partner', ['country']);

    const PcTaxFreeReceiptScreen = (ReceiptScreen) =>
        class extends ReceiptScreen {
			constructor (){
				//Free Tax connection
				super(...arguments);
				session.tokenFreeTax = false;
				this.loadFreeTaxToken();
			}
			_grantAccess(ev){
        		ev.preventDefault();
				this.loadFreeTaxToken();
			}
			async loadFreeTaxToken() {
            	try {
					const token = await this.rpc({
						model: 'res.company',
						method: 'UserAuthenticationRequestSessionToken',
						args: [this.env.pos.pos_session.config_id[0]],
						kwargs: {},
					});
					api_mode = await this.rpc({
						model: 'res.company',
						method: 'getApiMode',
						args: [this.env.pos.pos_session.config_id[0]],
						kwargs: {},
					});
					prod_issueposturl = await this.rpc({
						model: 'res.company',
						method: 'getIssuePostUrlProd',
						args: [this.env.pos.pos_session.config_id[0]],
						kwargs: {},
					});
					if(token != false){
						$("#box_loading_free_tax").hide();
						$("#box_button_free_tax").show();
						$("#box_error_free_tax").hide();
						session.tokenTaxFree = token;
						this.eligibilityDetection();
					} else {
						$("#box_loading_free_tax").hide();
						$("#box_button_free_tax").hide();
						$("#box_error_free_tax").show();
						$("#button_freetax").attr('disabled', true);
						return false;
					}
				} catch (error) {
					if (isRpcError(error) && error.message.code < 0) {
						this.showPopup('ErrorPopup', {
							title: this.env._t('Network Error'),
							body: this.env._t('Cannot access order management screen if offline.'),
						});
					} else {
						throw error;
					}
				}
			}
			async _printReceiptFreeTax(currentOrder) {
				var order = currentOrder;
				console.log("ORDER POST FREE TAX");
				console.log(order);
				console.log("pdf_free_tax_receipt_for_printer");
				console.log(pdf_free_tax_receipt_for_printer);
				if(order){
					var data = pdf_free_tax_receipt_for_printer;
					var winparams = 'dependent=yes,locationbar=no,scrollbars=yes,menubar=yes,'+
						'resizable,screenX=50,screenY=50,width=850,height=1050';

					var htmlPop = '<embed width=100% height=100%'
									 + ' type="application/pdf"'
									 + ' src="data:application/pdf;base64,'
									 + escape(data)
									 + '"></embed>';
					var printWindow = window.open ("", "PDF", winparams);
					printWindow.document.write (htmlPop);
				}
			}
            async printReceiptFreeTax() {
                const isPrinted = await this._printReceiptFreeTax(this.currentOrder);
                if (isPrinted) {
                	console.log("Print tax Free ok")
//                    this.currentOrder._printed = true;
                }
            }
			async target_form_free_tax_transfer(e)
			{
				e.preventDefault()
				var form = document.querySelector("#free_tax_form")

                var order = this.currentOrder;

                if(order !== undefined){
               		var o_number = order.name;

               		console.log("------ORDER-----a");
               		console.log(order);
                	var client = order.get_client();
                	if(client){
                		var client = order.get_client();
                		console.log("-----CLIENT-------");
                		console.log(client);

                		var purchase_items = "";

						var order_lines = order.orderlines.models
						var self = this;
						var client_vat = "";
						if(client.vat != ""){
							client_vat = client.vat
						}
						var total_order_lines = 0;
						$.each( order_lines, function( key, value ) {
							total_order_lines = total_order_lines + 1;
						});
						console.log("Total linea ordenes");
						console.log(total_order_lines);
						if(order_lines !== undefined){
							var i_o = 0
							$.each( order_lines, function( key, value ) {
								var product_rate = order_lines[key].product.tax_amount;
								var product_name = order_lines[key].product.display_name;
								var product_description = order_lines[key].product.description_sale;

								console.log("MORE INFO PRODUCT");
								console.log(order_lines[key].product);
								console.log("MORE INFO ORDER LINE");
								console.log(order_lines[key]);
								var product_quantity = order_lines[key].quantity;
								var discount_line = 0;
								if(order_lines[key].discount != undefined){
									discount_line = order_lines[key].discount
								}
								var product_id = order_lines[key].product.id;
								var product_category = order_lines[key].product.categ.name;
								var product_ref = order_lines[key].product.default_code;
								var product_unit_amount = order_lines[key].price;
								var product_unit_tax = order_lines[key].product.tax_amount;

								if(discount_line > 0){
									product_unit_amount = product_unit_amount - ((product_unit_amount * discount_line) / 100)
								}
								var product_unit_amount = (product_unit_amount * product_unit_tax / 100) + product_unit_amount;
								var total_line_product_amount = product_unit_amount * product_quantity;

								if(total_order_lines == 1){
									purchase_items += '{
											"vatRate": '+product_rate+',
											"quantity": '+product_quantity+',
											"unitQuantity": 1,
											"goodId": "'+product_id+'",
											"goodDescription": "'+product_name+'",
											"goodDetailDescription": "'+product_description+'",
											"goodCategory": "'+product_category+'",
											"measurementUnit": "",
											"serialNumber": "'+product_ref+'",
											"productCode": "'+product_ref+'",
											"amount": {
											  "grossAmount": '+total_line_product_amount+'
											},
											"unitAmount": {
											  "grossAmount": '+product_unit_amount+'
											},
											"goodCustomsClassification": "",
											"masterAmount": "",
											"customParameters": []
										  }';
								}
								if(total_order_lines > 1){
									if(i_o == 0){
										purchase_items += '{
											"vatRate": '+product_rate+',
											"quantity": '+product_quantity+',
											"unitQuantity": 1,
											"goodId": "'+product_id+'",
											"goodDescription": "'+product_name+'",
											"goodDetailDescription": "'+product_description+'",
											"goodCategory": "'+product_category+'",
											"measurementUnit": "",
											"serialNumber": "'+product_ref+'",
											"productCode": "'+product_ref+'",
											"amount": {
											  "grossAmount": '+total_line_product_amount+'
											},
											"unitAmount": {
											  "grossAmount": '+product_unit_amount+'
											},
											"goodCustomsClassification": "",
											"masterAmount": "",
											"customParameters": []
										  },';
									} else {
										if(i_o < total_order_lines){
											purchase_items += '{
												"vatRate": '+product_rate+',
												"quantity": '+product_quantity+',
												"unitQuantity": 1,
												"goodId": "'+product_id+'",
												"goodDescription": "'+product_name+'",
												"goodDetailDescription": "'+product_description+'",
												"goodCategory": "'+product_category+'",
												"measurementUnit": "",
												"serialNumber": "'+product_ref+'",
												"productCode": "'+product_ref+'",
												"amount": {
												  "grossAmount": '+total_line_product_amount+'
												},
												"unitAmount": {
												  "grossAmount": '+product_unit_amount+'
												},
												"goodCustomsClassification": "",
												"masterAmount": "",
												"customParameters": []
											  },';
										}
									}

									if(i_o == total_order_lines){
										purchase_items += '{
											"vatRate": '+product_rate+',
											"quantity": '+product_quantity+',
											"unitQuantity": 1,
											"goodId": "'+product_id+'",
											"goodDescription": "'+product_name+'",
											"goodDetailDescription": "'+product_description+'",
											"goodCategory": "'+product_category+'",
											"measurementUnit": "",
											"serialNumber": "'+product_ref+'",
											"productCode": "'+product_ref+'",
											"amount": {
											  "grossAmount": '+total_line_product_amount+'
											},
											"unitAmount": {
											  "grossAmount": '+product_unit_amount+'
											},
											"goodCustomsClassification": "",
											"masterAmount": "",
											"customParameters": []
										  }';
									}
								}
								i_o++;
							});
						}

						var formatted_date_for_integra = order.formatted_validation_date.split(" ")
						console.log("formatted_date_for_integra split");
						console.log(formatted_date_for_integra);
						if(formatted_date_for_integra[0] != ""){
							formatted_date_for_integra = formatted_date_for_integra[0].split("/");
							formatted_date_for_integra = formatted_date_for_integra[2] + "-" + formatted_date_for_integra[1] + "-" + formatted_date_for_integra[0]
						}
						console.log("formatted_date_for_integra");
						console.log(formatted_date_for_integra);

                		var issuemodelJSONstring = '{
						  "traveller": {
							"address": {
							  "street": "'+client.street+'",
							  "state": "'+client.state_id[1]+'",
							  "city": "'+client.city+'",
							  "zip": "'+client.zip+'"
							},
							"travelDocument": {
							  "documentType": "Other", //Pasamos Other por que Odoo almacena el VAT no distingue entre pasaporte o dni
							  "documentNumber": "'+client_vat+'",
//							  "documentExpiryDate": "2030-03-06",
							  "documentCountry": {
								"numericCode": '+client.country_id[0]+'
							  }
							},
							//Odoo no diferencia genero
//							"gender": "Male",
//							"title": "Mr",
							"firstName": "'+client.name+'",
							"lastName": "'+client.name+'",
//							"lastName": "TRAVELLER",
//							"taxRegistrationNumber": "",
							"mobileNumber": "'+client.phone+'",
							"email": "'+client.email+'",
//							"statusOfResidence": "",
							"countryOfResidence": {
							  "numericCode": '+client.country_id[0]+'
							},
//							"dateOfBirth": "1978-04-01",
//							"nationality": {
//							  "icaoCode": "AGO"
//							},
//							"travellerIdentifier": "",
							"customParameters": []
						  },
						  "trip": {
							"portOfEntry": "",
							"arrivalDate": "",
							"departureDate": "",
							"finalDestinationCountry": {
							  "alpha2Code": "",
							  "alpha3Code": "",
							  "numericCode": 0
							}
						  },
						  "shop": {
							"shopId": "'+order.pos.company.id+'",
							"deskId": "'+order.pos.pos_session.name+'",
							"shopAssistant": "'+order.employee.name+'"
						  },
						  "tourInfo": {
							"tourNumber": "",
							"startDate": "",
							"endDate": ""
						  },
						  "purchase": {
							"purchasePaymentMethod": [
							  "Cash",
							  "Cheque"
							],
							"receipts": [
							  {
								"receiptNumber": "'+order.name+'",
								"receiptDate": "'+formatted_date_for_integra+'",
								"totalAmount": {
									"grossAmount": 300,
									"netAmount": 350,
									"vatAmount": 50
								},
								"totalsPerVat": [],
								"purchaseItems": [
								  '+purchase_items+'
								],
								"till": "",
								"storeCode": "",
								"barcodeContent": ""
							  }
							]
						  },
						  "shopInvoiceNumber": "'+o_number+'",
						  "externalDocumentReference": "'+o_number+'",
						  "refund": {
							"serviceId": 0,
							"refundTarget": {
							  "refundMethod": "",
							  "nonCashMetadata": {
								"ncId": 0,
								"mainType": "",
								"subType": "",
								"displayValue": ""
							  },
							  "paymentCard": {
								"tokenValue": "",
								"tokenProvider": "",
								"encryptedValue": "",
								"encryptionKeyId": "",
								"maskedValue": "",
								"displayValue": "",
								"scheme": "",
								"type": "",
								"cardHolderName": ""
							  },
							  "bankTransfer": {
								"accountHolder": "",
								"accountNumber": "",
								"bankCode": "",
								"bankName": "",
								"bankAddress": "",
								"bankCountry": {
								  "alpha2Code": "",
								  "alpha3Code": "",
								  "numericCode": 0
								}
							  },
							  "pspReference": {
								"referenceNumber": "",
								"providerName": ""
							  }
							},
							"shopTakesRisk": false,
							"travellerFee": {}
						  },
						  "customParameters": [],
						  "senderId": "IC2i_Web_Odoo"
						}';

						console.log("ISSUE PRETTY");
						console.log(issuemodelJSONstring);

						$("#form_issuemodel").val(issuemodelJSONstring);
		//				// open new window for IC2 Integra UI
						window.open('', 'formpopup', "width=" + screen.availWidth + ",height=" +screen.availHeight);
						form.target = 'formpopup';
		//				// IC2 Integra UI URL
						console.log("API MODE");
						console.log(api_mode);
						var issueposturl = "";
						if(api_mode == 'dev'){
							console.log("Mode is dev");
							issueposturl = "https://ic2integra-web.mspe.globalblue.com/ui/integra";
						} else {
							console.log("Mode is prod");
							issueposturl = prod_issueposturl;
						}

						form.action = issueposturl;
						form.submit();

						function receiveMessage(event)
						{
							// ensure event.data received is valid
							if (event != null && event.data != null && event.data != "")
							{
								let ic2response = event.data;
								// ensure received message originates from IC2 Integra UI
								if (ic2response.originator === "IC2")
								{
									var issueprettyres = JSON.stringify(ic2response, undefined, 4);
									issueprettyres = $.parseJSON(issueprettyres);
									console.log(issueprettyres);
									console.log(issueprettyres.success);
									console.log(issueprettyres.actionResponse.base64PrintData);
									if(issueprettyres.success == true){
										var pdf = issueprettyres.actionResponse.base64PrintData
										console.log("Establezco la constante test");
										pdf_free_tax_receipt_for_printer = pdf
										var document_identifier = issueprettyres.actionResponse.documentIdentifier
										var totalGrossAmount = issueprettyres.actionResponse.totalGrossAmount
										var shopInvoiceNumber = issueprettyres.actionResponse.shopInvoiceNumber
										$.ajax({
                							url: '/web/save_integra',
											type: 'POST',
											data: { document_identifier: document_identifier, pdf: pdf, shopInvoiceNumber: shopInvoiceNumber, totalGrossAmount: totalGrossAmount },
											success: function(data) {
												$("#button_print_receipt_freetax").attr('disabled', false);
												console.log("DATA FUNCTION SAVE INTEGRA");
//												console.log(data);
											}
										});


									}
									if(issueprettyres.success == false){
										console.log("FLASO");
									}

								}
							}
						}

						window.addEventListener("message", receiveMessage, false);

						return true;
                	}
                }
                this.showPopup('ErrorPopup', {
					title: this.env._t('Order Error'),
					body: this.env._t('Order not detected'),
				});
                return false;
			}
            async eligibilityDetection(){
            	$("#box_info_message_free_tax").html("");
            	$("#box_info_message_free_tax").show();
            	$("#box_info_message_free_tax").html("We are checking that all the data are valid to use the Free Tax service, this may take a few seconds, please wait...");
            	var country = false;
                const order = this.currentOrder;
                const client = order.get_client();
                this.orderUiState = useContext(order.uiState.ReceiptScreen);

				//
                if(client === null){
                	$("#box_warning_message_free_tax").html("In order to use the FreeTax service you must select a customer for the sale.");
                	$("#box_warning_message_free_tax").show();
					$("#box_info_message_free_tax").html("");
					$("#box_info_message_free_tax").hide();
					return false;
                }
                if(client){
                	if(client.country_id[0]){
                		country = client.country_id[0];
                	} else {
						$("#box_warning_message_free_tax").html("In order to use the FreeTax service, the customer must have an established country.");
						$("#box_warning_message_free_tax").show();
						$("#box_info_message_free_tax").html("");
						$("#box_info_message_free_tax").hide();
						return false;
                	}
                } else {
                	$("#box_warning_message_free_tax").html("In order to use the FreeTax service you must select a customer for the sale.");
                	$("#box_warning_message_free_tax").show();
					$("#box_info_message_free_tax").html("");
					$("#box_info_message_free_tax").hide();
					return false;
                }
                if(country == false){
                	$("#box_warning_message_free_tax").html("In order to use the FreeTax service, the customer must have an established country.");
                	$("#box_warning_message_free_tax").show();
					$("#box_info_message_free_tax").html("");
					$("#box_info_message_free_tax").hide();
					return false;
                }

                //Check Country in server
                var grossAmount = this._grossAmount();

                const touristIsValid = await this.rpc({
					model: 'tax.free',
					method: 'TouristEligibilityDetection',
					args: [country, this.env.pos.pos_session.config_id[0], grossAmount],
					kwargs: {},
				});
				if(touristIsValid === true){
					console.log("Establezco el token csrf al formulario del tax free");
					console.log(core.csrf_token)
					$("#csfr_token_free_tax_form").val(core.csrf_token)
					$("#form_sessiontoken").val(session.tokenTaxFree)

					$("#button_freetax").attr('disabled', false);
					$("#box_info_message_free_tax").html("");
					$("#box_info_message_free_tax").hide();
				}

            }
            _grossAmount() {
                const order = this.currentOrder;
                const orderTotalAmount = order.get_total_with_tax();
                const tip_product_id = this.env.pos.config.tip_product_id && this.env.pos.config.tip_product_id[0];
                const tipLine = order
                    .get_orderlines()
                    .find((line) => tip_product_id && line.product.id === tip_product_id);
                const tipAmount = tipLine ? tipLine.get_all_prices().priceWithTax : 0;
                const orderAmountStr = this.env.pos.format_currency(orderTotalAmount - tipAmount);
                if (!tipAmount) return orderAmountStr;
                const tipAmountStr = this.env.pos.format_currency(tipAmount);
                return `${orderAmountStr} + ${tipAmountStr} tip`;
            }
//			_getTaxForProduct(tax_id){
//				if(tax_id == false){
//					return ""
//				}
//				try {
//					const tax = this.rpc({
//						model: 'account.tax',
//						method: 'GetTaxNumber',
//						args: [tax_id],
//						kwargs: {},
//					});
//					if(tax != false){
//						return tax;
//					} else {
//						return "";
//					}
//				} catch (error) {
//					return "";
//				}
//			}
        };

    Registries.Component.extend(ReceiptScreen, PcTaxFreeReceiptScreen);
    return ReceiptScreen;
});

# Copyright (c) 2023, Navari Limited and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ConferenceRegistration(Document):
	pass

@frappe.whitelist(allow_guest=True)
def send_mail(email_address, username):
	email_template = frappe.get_doc("Email Template", 'Conference Registration');
	subject = email_template.subject;
	context = { 'username': username };
	email_body = frappe.render_template(email_template.response, context, is_path = False);
	
	try:
		frappe.sendmail(
			recipients = [ email_address ],
			subject = subject,
			message = email_body
		)
	except Exception as e:
		frappe.msgprint(str(e))

frappe.ready(function() {
	frappe.web_form.after_save = function() {
		frappe.call({
			method: 'navari_customizations.navari_customizations.doctype.conference_registration.conference_registration.send_mail',
			args: {
				'email_address': frappe.web_form.get_value('email_address'),
				'username': frappe.web_form.get_value('name1')
			}
		});
	};
})
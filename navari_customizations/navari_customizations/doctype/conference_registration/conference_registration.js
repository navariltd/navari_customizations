// Copyright (c) 2023, Navari Limited and contributors
// For license information, please see license.txt

frappe.ui.form.on('Conference Registration', {
	on_submit: function(frm) {
		frappe.msgprint('You will receive a confirmation email shortly.');
		frappe.call({
			method: 'navari_customizations.navari_customizations.doctype.conference_registration.conference_registration.send_mail',
			args: {
				'email_address': frm.doc.email_address,
				'username': frm.doc.name1
			}
		});
	}
});
import frappe
from frappe import _
from frappe.utils import get_url

EMAIL_FIELD_CANDIDATES = [
	"email_id",
	"email",
	"company_email",
	"personal_email",
]


@frappe.whitelist()
def get_feedback_recipients(reference_type: str, reference_name: str):
	recipients = []

	if not reference_type or not reference_name:
		return recipients

	seen = set()

	def add_recipient(email, full_name=None, is_primary=0):
		if not email:
			return

		email = email.strip().lower()

		if not email or email in seen:
			return

		seen.add(email)

		recipients.append(
			{
				"email": email,
				"full_name": full_name,
				"is_primary": is_primary,
			}
		)

	if reference_type == "Customer":
		customer = frappe.get_doc("Customer", reference_name)

		if customer.get("email_id"):
			add_recipient(customer.email_id, customer.customer_name, 1)

		links = frappe.get_all(
			"Dynamic Link",
			filters={
				"link_doctype": "Customer",
				"link_name": reference_name,
				"parenttype": "Contact",
			},
			fields=["parent"],
		)

		for link in links:
			contact = frappe.get_doc("Contact", link.parent)

			for email_row in contact.email_ids or []:
				add_recipient(
					email_row.email_id,
					contact.full_name,
					email_row.is_primary,
				)

	elif reference_type in ["Lead", "CRM Lead"]:
		lead = frappe.get_doc(reference_type, reference_name)

		for fieldname in EMAIL_FIELD_CANDIDATES:
			if lead.get(fieldname):
				add_recipient(
					lead.get(fieldname),
					lead.get("lead_name") or lead.get("full_name"),
					1,
				)

		links = frappe.get_all(
			"Dynamic Link",
			filters={
				"link_doctype": reference_type,
				"link_name": reference_name,
				"parenttype": "Contact",
			},
			fields=["parent"],
		)

		for link in links:
			contact = frappe.get_doc("Contact", link.parent)

			for email_row in contact.email_ids or []:
				add_recipient(
					email_row.email_id,
					contact.full_name,
					email_row.is_primary,
				)

	elif reference_type == "CRM Deal":
		deal = frappe.get_doc("CRM Deal", reference_name)

		for fieldname in EMAIL_FIELD_CANDIDATES:
			if deal.get(fieldname):
				add_recipient(
					deal.get(fieldname),
					deal.get("organization") or deal.get("deal_name"),
					1,
				)

	elif reference_type == "Supplier":
		supplier = frappe.get_doc("Supplier", reference_name)

		if supplier.get("email_id"):
			add_recipient(
				supplier.email_id,
				supplier.supplier_name,
				1,
			)

		links = frappe.get_all(
			"Dynamic Link",
			filters={
				"link_doctype": "Supplier",
				"link_name": reference_name,
				"parenttype": "Contact",
			},
			fields=["parent"],
		)

		for link in links:
			contact = frappe.get_doc("Contact", link.parent)

			for email_row in contact.email_ids or []:
				add_recipient(
					email_row.email_id,
					contact.full_name,
					email_row.is_primary,
				)

	elif reference_type == "User":
		user = frappe.get_doc("User", reference_name)

		add_recipient(
			user.email,
			user.full_name,
			1,
		)

	return recipients


@frappe.whitelist()
def initiate_feedback(
	task: str,
	reference_type: str,
	reference_name: str,
	quality_feedback_template: str,
	custom_description: str,
	recipients: list | str,
):
	if isinstance(recipients, str):
		recipients = frappe.parse_json(recipients)

	if not recipients:
		frappe.throw(_("Please provide at least one recipient"))

	created_feedback = []
	base_url = get_url()

	task_doc = frappe.get_doc("Task", task)
	task_subject = task_doc.subject or task

	for recipient in recipients:
		email = recipient.get("email")
		full_name = recipient.get("full_name") or ""

		if not email:
			continue

		qf = frappe.new_doc("Quality Feedback")
		qf.custom_task = task
		qf.document_type = reference_type
		qf.document_name = reference_name
		qf.custom_email = email
		qf.template = quality_feedback_template
		qf.custom_description = custom_description

		qf.custom_status = "Draft"

		qf.insert(ignore_permissions=True)

		feedback_link = f"{base_url}/feedback?id={qf.custom_route_id}"

		description_html = ""
		if custom_description:
			description_html = f"""
                <div style="margin: 20px 0; padding: 14px 16px; background-color: #f8fafc; border-left: 4px solid #c0212f; border-radius: 4px;">
                    <strong style="color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Note:</strong>
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">{custom_description}</p>
                </div>
            """

		email_message = f"""
            <div style="background-color: #f1f5f9; padding: 32px 16px; font-family: system-ui, -apple-system, sans-serif;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden;">
                    <tr>
                        <td style="padding: 32px 24px 20px 24px;">
                            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Share Your Feedback</h2>
                            <p style="margin: 0 0 12px 0; color: #334155; font-size: 14px; line-height: 1.6;">Hello {full_name or "Valued Customer"},</p>
                            <p style="margin: 0 0 16px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                                We would highly appreciate it if you could take a brief moment to rate our service delivery regarding your recent completed task: 
                                <strong style="color: #0f172a;">{task_subject}</strong>.
                            </p>
                            
                            {description_html}
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 28px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{feedback_link}" target="_blank" style="background-color: #c0212f; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(192, 33, 47, 0.2);">
                                            Complete Feedback Form
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0 0 16px 0;" />
                            <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                                Your responses are handled carefully and used strictly to improve our technical workflows and quality benchmarks.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 500;">
                                &copy; {frappe.utils.now_datetime().year} Navari Limited. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        """

		frappe.sendmail(
			recipients=[email],
			subject=_("Feedback Request: {0}").format(task_subject),
			message=email_message,
		)

		created_feedback.append(qf.name)

	frappe.db.commit()

	return created_feedback

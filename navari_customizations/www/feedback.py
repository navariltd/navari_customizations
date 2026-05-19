import frappe
from frappe import _


def get_context(context):
	frappe.local.response["headers"] = {
		"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
		"Pragma": "no-cache",
	}

	route_id = frappe.local.form_dict.get("id")

	if not route_id:
		frappe.throw(_("Invalid feedback link"))

	doc = frappe.get_doc("Quality Feedback", {"custom_route_id": route_id})

	context.is_submitted = getattr(doc, "status", None) == "Submitted"

	if not context.is_submitted:
		for p in doc.parameters:
			p.rating = 0
			p.feedback = ""

	context.doc = doc
	context.parameters = doc.parameters
	context.route_id = route_id
	context.hide_navbar = True
	context.description = getattr(doc, "custom_description", None)

import uuid

import frappe
from frappe import _


def before_validate(doc, method):
	if not doc.custom_route_id:
		doc.custom_route_id = generate_unique_route_id()

	ensure_unique_route_id(doc)


def generate_unique_route_id():
	return str(uuid.uuid4()).replace("-", "")[:12]


def ensure_unique_route_id(doc):
	if not doc.custom_route_id:
		return

	exists = frappe.db.exists(
		doc.doctype,
		{
			"custom_route_id": doc.custom_route_id,
			"name": ["!=", doc.name or ""],
		},
	)

	if exists:
		doc.custom_route_id = generate_unique_route_id()
		ensure_unique_route_id(doc)


@frappe.whitelist(allow_guest=True)
def submit_quality_feedback(route_id, data):
	if isinstance(data, str):
		data = frappe.parse_json(data)

	if not route_id:
		frappe.throw(_("Invalid link metadata provided"))

	doc = frappe.get_doc("Quality Feedback", {"custom_route_id": route_id})

	if doc.status == "Submitted":
		frappe.throw(_("This feedback form has already been submitted"))

	existing_parameters = doc.get("parameters") or []

	for item in data:
		idx = int(item.get("parameter_index") or 0)

		if idx < len(existing_parameters):
			row = existing_parameters[idx]
			row.rating = int(item.get("rating") or 0)
			row.feedback = item.get("feedback") or ""

	doc.status = "Submitted"
	doc.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Feedback submitted successfully"}

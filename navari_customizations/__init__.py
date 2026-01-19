import frappe
from frappe.utils.user import is_website_user
from frappe.utils.modules import get_modules_from_all_apps_for_user

__version__ = "0.0.1"


def check_app_permission():
	if frappe.session.user == "Administrator":
		return True

	if is_website_user():
		return False

	return True

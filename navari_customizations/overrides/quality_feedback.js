frappe.ui.form.on("Quality Feedback", {
  refresh(frm) {
    if (!frm.doc.custom_route_id || frm.is_new()) {
      return;
    }

    const url = `${window.location.origin}/feedback?id=${frm.doc.custom_route_id}`;

    frm.add_web_link(url, "View Feedback Form");
  },
});

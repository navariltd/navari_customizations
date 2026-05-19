frappe.ui.form.on("Task", {
  refresh(frm) {
    if (frm.doc.status !== "Completed" || frm.is_new()) {
      return;
    }

    frm.add_custom_button(__("Request Feedback"), async () => {
      const get_recipients = async (reference_type, reference_name) => {
        if (!reference_type || !reference_name) return [];
        const r = await frappe.call({
          method:
            "navari_customizations.overrides.task.get_feedback_recipients",
          args: { reference_type, reference_name },
        });
        return r.message || [];
      };

      const initial_recipients = await get_recipients(
        frm.doc.custom_reference_type,
        frm.doc.custom_reference_name,
      );

      const dialog = new frappe.ui.Dialog({
        title: __("Request Feedback"),
        size: "large",
        fields: [
          {
            label: __("Reference Type"),
            fieldname: "reference_type",
            fieldtype: "Link",
            options: "DocType",
            get_query: () => {
              return {
                filters: [
                  [
                    "DocType",
                    "name",
                    "in",
                    [
                      "Customer",
                      "Lead",
                      "CRM Lead",
                      "CRM Deal",
                      "User",
                      "Supplier",
                    ],
                  ],
                ],
              };
            },
            default: frm.doc.custom_reference_type || "",
            change: () => {
              const val = dialog.get_value("reference_type");
              if (val && val !== frm.doc.custom_reference_type) {
                dialog.set_value("reference_name", "");
              }
            },
          },
          {
            fieldtype: "Column Break",
          },
          {
            label: __("Reference Name"),
            fieldname: "reference_name",
            fieldtype: "Dynamic Link",
            options: "reference_type",
            default: frm.doc.custom_reference_name || "",
            change: async () => {
              const ref_type = dialog.get_value("reference_type");
              const ref_name = dialog.get_value("reference_name");

              if (ref_type && ref_name) {
                const recipients = await get_recipients(ref_type, ref_name);
                dialog.fields_dict.recipients.df.data = recipients;
                dialog.fields_dict.recipients.grid.refresh();
              }
            },
          },
          {
            fieldtype: "Section Break",
          },
          {
            label: __("Quality Feedback Template"),
            fieldname: "quality_feedback_template",
            fieldtype: "Link",
            options: "Quality Feedback Template",
            reqd: 1,
          },
          {
            label: __("Description / Prompt"),
            fieldname: "custom_description",
            fieldtype: "Small Text",
            description: __(
              "This text will be visible as instructions or context on the feedback submission form portal.",
            ),
          },
          {
            fieldtype: "Section Break",
          },
          {
            label: __("Recipients"),
            fieldname: "recipients",
            fieldtype: "Table",
            cannot_add_rows: false,
            in_place_edit: true,
            reqd: 1,
            data: initial_recipients,
            fields: [
              {
                fieldtype: "Data",
                fieldname: "email",
                label: __("Email"),
                in_list_view: 1,
                reqd: 1,
              },
              {
                fieldtype: "Data",
                fieldname: "full_name",
                label: __("Full Name"),
                in_list_view: 1,
              },
              {
                fieldtype: "Check",
                fieldname: "is_primary",
                label: __("Primary"),
                in_list_view: 1,
              },
            ],
          },
        ],
        primary_action_label: __("Request Feedback"),
        primary_action: async (values) => {
          const recipients = values.recipients?.filter((d) => d.email) || [];
          if (!recipients.length) {
            frappe.msgprint(__("Please add at least one recipient"));
            return;
          }

          await frappe.call({
            method: "navari_customizations.overrides.task.initiate_feedback",
            freeze: true,
            freeze_message: __("Sending Feedback Requests..."),
            args: {
              task: frm.doc.name,
              reference_type: values.reference_type,
              reference_name: values.reference_name,
              quality_feedback_template: values.quality_feedback_template,
              custom_description: values.custom_description || "",
              recipients,
            },
          });

          frappe.msgprint(__("Feedback requests created successfully"));
          dialog.hide();
          frm.reload_doc();
        },
      });

      dialog.show();
    });
  },
});

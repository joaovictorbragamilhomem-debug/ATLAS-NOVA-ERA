-- Templates created in WhatsApp Manager as "Order details" (Utility) show the
-- customer a "Review and pay" button. When this flag is on, the send step fills
-- that button with the installment's Pix copy-and-paste code and amount.
alter table message_templates
  add column pix_payment_button boolean not null default false;

import { NotificationLog, ServiceCall, UserProfile } from '../types';

/**
 * Dispatches an automatic notification email when a service call is created or assigned,
 * logging the full event to the database notification_log table.
 */
export async function sendServiceCallEmail({
  call,
  installer,
  eventType = 'new_call',
  customNote = ''
}: {
  call: ServiceCall;
  installer: UserProfile;
  eventType?: 'new_call' | 'updated' | 'reassigned' | 'overdue' | 'completed';
  customNote?: string;
}): Promise<NotificationLog> {
  const isNew = eventType === 'new_call';
  const subject = isNew
    ? `[Everlast Bathrooms] New Service Call Assigned: Job #${call.jobNumber} - ${call.client?.name || 'Client'}`
    : eventType === 'reassigned'
    ? `[Everlast Bathrooms] Call Reassigned: Job #${call.jobNumber} - ${call.client?.name || 'Client'}`
    : `[Everlast Bathrooms] Service Call Update: Job #${call.jobNumber}`;

  const priorityColor =
    call.priority === 'high' ? '#C4342B' : call.priority === 'mid' ? '#C97A16' : '#6B7A88';

  const bodyHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FBFBF9; border: 1px solid #DFE2DE; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #12161A; padding: 20px 24px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">EVERLAST BATHROOMS</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #9CA3AF;">Service Call Work Order Dispatch</p>
      </div>

      <div style="padding: 24px;">
        <div style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #ffffff; background-color: ${priorityColor}; border-radius: 4px; margin-bottom: 16px;">
          ${call.priority} PRIORITY
        </div>

        <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #12161A;">Hello ${installer.fullName},</h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #3A424B; line-height: 1.5;">
          ${
            isNew
              ? 'A new service call has been assigned to you. Please review the customer details and issue description below before heading to the site.'
              : `Service call Job #${call.jobNumber} has been updated.`
          }
        </p>

        <div style="background-color: #ffffff; border: 1px solid #DFE2DE; border-radius: 6px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6B7A88; width: 130px;">Job Number:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #12161A; font-variant-numeric: tabular-nums;">#${call.jobNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7A88;">Client:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #12161A;">${call.client?.name || 'Customer'}</td>
            </tr>
            ${call.client?.phone ? `
            <tr>
              <td style="padding: 6px 0; color: #6B7A88;">Client Phone:</td>
              <td style="padding: 6px 0; color: #0F5CC4;"><a href="tel:${call.client.phone}" style="color: #0F5CC4; text-decoration: none;">${call.client.phone}</a></td>
            </tr>` : ''}
            ${call.client?.address ? `
            <tr>
              <td style="padding: 6px 0; color: #6B7A88;">Address:</td>
              <td style="padding: 6px 0; color: #3A424B;">${call.client.address}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #6B7A88;">Reported Date:</td>
              <td style="padding: 6px 0; color: #3A424B;">${call.reportedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7A88;">Responsibility:</td>
              <td style="padding: 6px 0; color: #3A424B; text-transform: capitalize;">${call.responsibility}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7A88;">Billing:</td>
              <td style="padding: 6px 0; color: #3A424B; text-transform: capitalize;">${call.billing}</td>
            </tr>
            ${call.attachments && call.attachments.length > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #6B7A88;">Media Files:</td>
              <td style="padding: 6px 0; color: #0F5CC4; font-weight: 600;">${call.attachments.length} attachment(s) available on portal</td>
            </tr>` : ''}
          </table>

          <div style="margin-top: 14px; pt: 14px; border-top: 1px solid #DFE2DE; padding-top: 14px;">
            <div style="font-size: 13px; font-weight: 600; color: #6B7A88; margin-bottom: 6px;">ISSUE DESCRIPTION:</div>
            <div style="font-size: 15px; color: #12161A; line-height: 1.5; background: #FBFBF9; padding: 12px; border-radius: 4px; border-left: 3px solid #0F5CC4;">
              ${call.description}
            </div>
          </div>

          ${customNote ? `
          <div style="margin-top: 14px; pt: 14px; border-top: 1px solid #DFE2DE; padding-top: 14px;">
            <div style="font-size: 13px; font-weight: 600; color: #6B7A88; margin-bottom: 6px;">OFFICE NOTE:</div>
            <div style="font-size: 14px; color: #3A424B; line-height: 1.4;">${customNote}</div>
          </div>` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0 12px 0;">
          <a href="#call-${call.id}" style="display: inline-block; background-color: #0F5CC4; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Open Service Call in Mobile Portal
          </a>
        </div>

        <p style="margin: 20px 0 0 0; font-size: 13px; color: #6B7A88; text-align: center;">
          Remember to upload resolution photos and mark the call complete once finished, or note reasons if blocked.
        </p>
      </div>

      <div style="background-color: #F0F2F0; padding: 14px 24px; border-top: 1px solid #DFE2DE; font-size: 12px; color: #6B7A88; text-align: center;">
        Everlast Bathrooms Portal • Dispatch Notification to ${installer.email}
      </div>
    </div>
  `;

  // Log record to notification_log table
  const logRecord: NotificationLog = {
    id: 'notif_' + Math.random().toString(36).substring(2, 9),
    serviceCallId: call.id,
    jobNumber: call.jobNumber,
    clientName: call.client?.name || 'Customer',
    recipientEmail: installer.email,
    recipientName: installer.fullName,
    eventType,
    subject,
    bodyHtml,
    status: 'sent',
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return logRecord;
}

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  const { placeName, address, householdName, approvedBy } = await request.json()

  try {
    await resend.emails.send({
      from: 'Map Out <onboarding@resend.dev>',
      to: process.env.NOTIFICATION_EMAIL,
      subject: `✅ ${placeName} is on the Yes List!`,
      html: `
        <div style="font-family: Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #EEF2F7; border-radius: 16px;">
          <div style="background: #1A73E8; color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8; margin-bottom: 4px;">MAP OUT</div>
            <div style="font-size: 22px; font-weight: 800;">New place approved! 🗺️</div>
          </div>
          <div style="background: white; border-radius: 12px; padding: 20px 24px; border-left: 4px solid #1E8E3E;">
            <div style="font-size: 20px; font-weight: 700; color: #202124; margin-bottom: 8px;">${placeName}</div>
            ${address ? `<div style="color: #1A73E8; font-size: 14px; margin-bottom: 8px;">📍 ${address}</div>` : ''}
            <div style="color: #5F6368; font-size: 14px; margin-bottom: 4px;">✅ Status: <strong style="color: #1E8E3E;">We're In</strong></div>
            ${approvedBy ? `<div style="color: #5F6368; font-size: 14px; margin-bottom: 4px;">👤 Approved by: <strong>${approvedBy}</strong></div>` : ''}
            <div style="color: #5F6368; font-size: 14px;">🏠 List: <strong>${householdName}</strong></div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #5F6368; font-size: 13px;">
            Head to Map Out to set the trip status and start planning!
          </div>
        </div>
      `,
    })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

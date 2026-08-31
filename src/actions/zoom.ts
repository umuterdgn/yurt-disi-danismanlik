'use server';

export async function createZoomMeeting(meetingData: {
  topic: string;
  start_time: string;
  duration: number;
}) {
  try {
    const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
    const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET;

    if (!ZOOM_API_KEY || !ZOOM_API_SECRET) {
      return { success: false, error: 'Zoom API credentials not configured' };
    }

    // Generate JWT token (simplified - in production use proper JWT library)
    const payload = {
      iss: ZOOM_API_KEY,
      exp: Date.now() + 60000
    };

    // For production, use proper JWT encoding
    // This is a simplified version - you should use jsonwebtoken library
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: meetingData.topic,
        type: 1, // Instant meeting
        start_time: meetingData.start_time,
        duration: meetingData.duration,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: false,
          watermark: false,
          use_pmi: false,
          approval_type: 2,
          audio: 'both',
          auto_recording: 'cloud'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: `Zoom API error: ${errorData.message || response.statusText}` };
    }

    const data = await response.json();
    const zoomLink = data.join_url;

    return {
      success: true,
      zoomLink,
      meetingId: data.id
    };

  } catch (error) {
    console.error('Create Zoom meeting error:', error);
    return { success: false, error: 'Zoom toplantısı oluşturulurken bir hata oluştu' };
  }
}

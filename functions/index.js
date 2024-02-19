const functions = require("firebase-functions");
const textToSpeech = require("@google-cloud/text-to-speech");
const client = new textToSpeech.TextToSpeechClient({
  type: "service_account",
  project_id: "vgina-412004",
  private_key_id: "91343028ed0cfcfeb057261967c209b7d4a2eaa2",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqd1z1Z2RSXHoU\no/TseFum0efUgWAYo2Vf0AqUtmdgmmh8KEIHiZbIn7FI9gDHybBadcQ3aOUouo2I\n/RDWM4xAMqZoWYCz6ZrG4NQDNGIsk5aTQyugMeRMetxcMQlKPqYNfq+espbYTE3j\nM54Unb9tEhxEsC/ltHGNjFQs7GYttn/OTE6iHz1pPVhKVlXNklylBnqhvWFggGkd\neIcwuP1hKvjECnwV7cE+wL2ZlFphY1PbpSYPKZU6E1lT/wIat1OQnbg4de6gjqVh\n5sCzwreIvPvis5+G0HazGJQtkH5JWMHHR6p5dsPkc2kiSVvTAXDLyO9tctOyTfiz\nt+Eyy5VZAgMBAAECggEAJENHIadQdprYl4p3YFSMPrUZiaHKBQPBXXv+vDr/S9Qd\nFQhlX4Ab9OrPxnMaoGWd3+h8iMMGOL9Su4kGK2ME22VK9BjSIbO4qsUKJPJgThZJ\namNYJPhoFgLu3KfLz6D7JxTDnFFmeHXm/cWtw7n5DmVTYSNP1SApJdDr2TCi3edD\nHwslVW4Wbr4s9EA605oL6VTcLXW0IKq7lLSj8B2RNGldfIOQVFm4rD9wYNTeGIsh\nArlYJFaZgDkZiXK3CvWwae6PbTKGv2zXB6NW1wVEI8MmBM8A9+XBVQf+O8MHm4Xf\nambVeD1eRlXbDjbEgsqzRk1QFNbma6cIT0CVbPEE2QKBgQDjY5itL0nvbFR8fQKp\nfVbAt7aFbL8fzqO+2syUaUVSGtikhzvfzHw37jCUZNUmC1LRj7CXu9hEVYEYGJv5\nJkm4FgokLfrz6iKwyFtNXVOq3LxjfticOjlLL/gESNilBwliOmQ3xAHIrPIlnyOW\ndSdIjvf99C5LcyIgIQVlyxhahQKBgQC/6juuJRHZH467a9ZWvQOokmBkXgtrn0Tl\nGqDYerlps+qjYcK0kEjtawoq+3OZMYvwuNHYHup9QCby+GoWGV5/U7QjMvFhoo1L\nFlj0SAIVdTG/EkL3fnMaFxX2S8zSK48xazm8TdvpZsksTQcJi5bSJSxFYMp452sD\ndAsFwaZJxQKBgBbp1ly9QyoJNIpG3pnNs4w/9viC+M9vtzhoO+1Inl+jrOkHZ5Up\nueq46dRKROBMi8/qNtVTbHuWUifncvAsV4lhTyxOJdemZFCEIA8vtFqnW6R7B8DW\nbSeScd+cp5gZmWx4jdjAu51JMC1yV9e1fnvlTEAe9vtLYsjyCuUzDgUxAoGAbRJz\n7sp0tWDhHxXv0IZGUQU4MXLdrMHtRwR2S/Kb9D5j6Y2DOloSiJTgR4N3tKZbMWnp\nIZqYjKzsNgUHTh4G/fiVlbe7RlE7WmSOE+/k90sPBdgcJUtBoZ9jRQLZms1U6bJW\nMvZROPrI9RumFz+1bSPhYGDdUg+8W08VgKUJnD0CgYEAu8xsu0DIPZ96gtUlbx7V\nbJ+GNQIQUe0VnQR7hwO+T/Amjl5Lj/5oX+qsb6A9VcJ0m6ywJnejcYdSYn1Ads+M\nlP3gQ31zyzqfMPPOLiLxvdPCUjXi8PnEGCdwvkejfFB8jZ5dL13MIkvKK4VDHLG0\n2MUE0dKCjntQnM+c638TPjk=\n-----END PRIVATE KEY-----\n",
  client_email: "vgina-264@vgina-412004.iam.gserviceaccount.com",
  client_id: "105320229785219011118",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/vgina-264%40vgina-412004.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
});

exports.processSpeakAction = functions.https.onCall(async (data, context) => {
  const request = {
    input: { text: data },
    voice: {
      languageCode: "en-US",
      name: "en-US-Studio-O",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1,
      effectsProfileId: ["large-home-entertainment-class-device"],
    },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    const audioContentBase64 = response.audioContent.toString("base64");
    console.error("SUCCESS Response:", audioContentBase64);
    return { audioContent: audioContentBase64 };
  } catch (error) {
    console.error("Error:", error);
    throw new functions.https.HttpsError("unknown", `Failed to synthesize speech for: ${sound}`, error);
  }
});

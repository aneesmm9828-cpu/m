import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const BHASHINI_USER_ID = Deno.env.get('BHASHINI_USER_ID')
const BHASHINI_ULCA_API_KEY = Deno.env.get('BHASHINI_ULCA_API_KEY')
const BHASHINI_INFERENCE_API_KEY = Deno.env.get('BHASHINI_INFERENCE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const { record } = await req.json()
    const { id, audio_url, owner_id } = record

    // 1. Fetch the audio file
    const audioRes = await fetch(audio_url)
    const audioBlob = await audioRes.blob()
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // 2. Get Bhashini Pipeline Config
    const configRes = await fetch("https://meity-auth.bhashini.gov.in/ulca/gw/v1/getModelsPipeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "userID": BHASHINI_USER_ID!,
        "ulcaApiKey": BHASHINI_ULCA_API_KEY!
      },
      body: JSON.stringify({
        "pipelineTasks": [
          {
            "taskType": "asr",
            "config": {
              "language": {
                "sourceLanguage": "or"
              }
            }
          }
        ],
        "pipelineRequestConfig": {
          "pipelineId": "64392f96daac500b55c543cd"
        }
      })
    })

    const configData = await configRes.json()
    const callbackUrl = configData.pipelineInferenceAPIEndPoint.callbackUrl
    const serviceId = configData.pipelineResponseConfig[0].config[0].serviceId

    // 3. Call Bhashini Inference
    const inferenceRes = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": BHASHINI_INFERENCE_API_KEY!
      },
      body: JSON.stringify({
        "pipelineTasks": [
          {
            "taskType": "asr",
            "config": {
              "language": {
                "sourceLanguage": "or"
              },
              "serviceId": serviceId,
              "audioFormat": "m4a", // Bhashini might need wav, might need conversion
              "samplingRate": 16000
            }
          }
        ],
        "inputData": {
          "audio": [
            {
              "audioContent": base64Audio
            }
          ]
        }
      })
    })

    const inferenceData = await inferenceRes.json()
    const transcript = inferenceData.pipelineResponse[0].output[0].source

    // 4. Update Database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    await supabase
      .from('voice_notes')
      .update({
        transcript_text: transcript,
        transcript_status: 'done'
      })
      .eq('id', id)

    return new Response(JSON.stringify({ success: true, transcript }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

package com.listen.app.audio

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File

class AudioRecorder(private val context: Context) {
    private var mediaRecorder: MediaRecorder? = null
    private var audioFile: File? = null

    fun startRecording(): File {
        // Create file for recording
        val fileName = "recording_${System.currentTimeMillis()}.wav"
        audioFile = File(context.cacheDir, fileName)

        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP)
            setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)
            setAudioSamplingRate(16000)
            setAudioChannels(1)
            setOutputFile(audioFile?.absolutePath)

            prepare()
            start()
        }

        return audioFile!!
    }

    fun stopRecording(): File {
        mediaRecorder?.apply {
            stop()
            release()
        }
        mediaRecorder = null

        return audioFile ?: throw IllegalStateException("No audio file")
    }

    fun cleanup() {
        // Clean up old recordings
        val files = context.cacheDir.listFiles { file ->
            file.name.startsWith("recording_") && file.name.endsWith(".wav")
        }?.sortedByDescending { it.lastModified() }

        files?.drop(5)?.forEach { it.delete() }
    }
}

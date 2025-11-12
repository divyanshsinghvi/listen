package com.listen.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.listen.app.audio.AudioRecorder
import com.listen.app.transcription.TranscriptionService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

enum class RecordingState {
    IDLE, RECORDING, PROCESSING
}

data class HistoryItem(
    val id: String,
    val text: String,
    val timestamp: Long
)

class RecordingViewModel(application: Application) : AndroidViewModel(application) {
    private val audioRecorder = AudioRecorder(application)
    private val transcriptionService = TranscriptionService(application)

    private val _state = MutableStateFlow(RecordingState.IDLE)
    val state: StateFlow<RecordingState> = _state

    private val _transcribedText = MutableStateFlow("")
    val transcribedText: StateFlow<String> = _transcribedText

    private val _history = MutableStateFlow<List<HistoryItem>>(emptyList())
    val history: StateFlow<List<HistoryItem>> = _history

    init {
        loadHistory()
    }

    fun toggleRecording() {
        when (_state.value) {
            RecordingState.IDLE -> startRecording()
            RecordingState.RECORDING -> stopRecording()
            RecordingState.PROCESSING -> { /* Do nothing */ }
        }
    }

    private fun startRecording() {
        _transcribedText.value = ""
        audioRecorder.startRecording()
        _state.value = RecordingState.RECORDING
    }

    private fun stopRecording() {
        val audioFile = audioRecorder.stopRecording()
        _state.value = RecordingState.PROCESSING

        viewModelScope.launch {
            try {
                val text = transcriptionService.transcribe(audioFile)
                _transcribedText.value = text
                _state.value = RecordingState.IDLE

                // Add to history
                addToHistory(text)

                // Copy to clipboard would be handled in the UI layer
            } catch (e: Exception) {
                _transcribedText.value = "Error: ${e.message}"
                _state.value = RecordingState.IDLE
            }
        }
    }

    private fun addToHistory(text: String) {
        val item = HistoryItem(
            id = System.currentTimeMillis().toString(),
            text = text,
            timestamp = System.currentTimeMillis()
        )

        _history.value = listOf(item) + _history.value.take(19)
        saveHistory()
    }

    fun clearHistory() {
        _history.value = emptyList()
        saveHistory()
    }

    private fun saveHistory() {
        // Save to SharedPreferences or Room database
        // Implementation depends on your preference
    }

    private fun loadHistory() {
        // Load from SharedPreferences or Room database
        // Implementation depends on your preference
    }
}

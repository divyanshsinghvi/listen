package com.listen.app.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.listen.app.viewmodel.RecordingViewModel
import com.listen.app.viewmodel.RecordingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: RecordingViewModel) {
    val state by viewModel.state.collectAsState()
    val transcribedText by viewModel.transcribedText.collectAsState()
    val clipboardManager = LocalClipboardManager.current
    var showHistory by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Listen") },
                actions = {
                    IconButton(onClick = { showHistory = true }) {
                        Icon(Icons.Default.History, "History")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(modifier = Modifier.height(32.dp))

            // Status Section
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                when (state) {
                    RecordingState.IDLE -> {
                        Icon(
                            Icons.Default.Mic,
                            contentDescription = "Microphone",
                            modifier = Modifier.size(120.dp),
                            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
                        )
                    }
                    RecordingState.RECORDING -> {
                        WaveformAnimation()
                    }
                    RecordingState.PROCESSING -> {
                        CircularProgressIndicator(
                            modifier = Modifier.size(80.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = when (state) {
                        RecordingState.IDLE -> if (transcribedText.isEmpty()) "Tap to record" else "Copied to clipboard!"
                        RecordingState.RECORDING -> "Listening..."
                        RecordingState.PROCESSING -> "Transcribing..."
                    },
                    style = MaterialTheme.typography.titleLarge,
                    textAlign = TextAlign.Center
                )

                // Transcribed Text Display
                if (transcribedText.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 200.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = transcribedText,
                                style = MaterialTheme.typography.bodyLarge
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            Button(
                                onClick = {
                                    clipboardManager.setText(AnnotatedString(transcribedText))
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.ContentCopy, "Copy")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Copy to Clipboard")
                            }
                        }
                    }
                }
            }

            // Record Button
            val infiniteTransition = rememberInfiniteTransition(label = "pulse")
            val scale by infiniteTransition.animateFloat(
                initialValue = 1f,
                targetValue = if (state == RecordingState.RECORDING) 1.1f else 1f,
                animationSpec = infiniteRepeating(
                    animation = tween(500),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "scale"
            )

            FloatingActionButton(
                onClick = { viewModel.toggleRecording() },
                modifier = Modifier
                    .size(80.dp)
                    .scale(scale),
                containerColor = if (state == RecordingState.RECORDING)
                    Color.Red else MaterialTheme.colorScheme.primary,
                shape = CircleShape
            ) {
                Icon(
                    if (state == RecordingState.RECORDING)
                        Icons.Default.Stop else Icons.Default.Mic,
                    contentDescription = if (state == RecordingState.RECORDING) "Stop" else "Record",
                    modifier = Modifier.size(36.dp),
                    tint = Color.White
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (state == RecordingState.RECORDING) "Tap to stop" else "Tap to record",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(32.dp))
        }
    }

    if (showHistory) {
        HistoryDialog(
            onDismiss = { showHistory = false },
            viewModel = viewModel
        )
    }
}

@Composable
fun WaveformAnimation() {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.height(100.dp)
    ) {
        repeat(5) { index ->
            val infiniteTransition = rememberInfiniteTransition(label = "wave$index")
            val height by infiniteTransition.animateFloat(
                initialValue = 0.3f,
                targetValue = 1.0f,
                animationSpec = infiniteRepeating(
                    animation = tween(500, delayMillis = index * 100),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "height"
            )

            Surface(
                modifier = Modifier
                    .width(8.dp)
                    .fillMaxHeight(height),
                color = Color.Red,
                shape = MaterialTheme.shapes.small
            ) {}
        }
    }
}

@Composable
fun HistoryDialog(
    onDismiss: () -> Unit,
    viewModel: RecordingViewModel
) {
    val history by viewModel.history.collectAsState()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Transcription History") },
        text = {
            Column {
                if (history.isEmpty()) {
                    Text("No history yet")
                } else {
                    history.forEach { item ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Text(
                                text = item.text,
                                modifier = Modifier.padding(12.dp),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        },
        dismissButton = {
            if (history.isNotEmpty()) {
                TextButton(onClick = { viewModel.clearHistory() }) {
                    Text("Clear")
                }
            }
        }
    )
}

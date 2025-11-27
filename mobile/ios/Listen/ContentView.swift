//
//  ContentView.swift
//  Listen - Voice to Text
//
//  Main UI view
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var audioRecorder: AudioRecorder
    @EnvironmentObject var transcriptionService: TranscriptionService
    @State private var transcribedText: String = ""
    @State private var isProcessing: Bool = false
    @State private var showHistory: Bool = false

    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Title
                Text("Listen")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.primary)

                Spacer()

                // Recording Animation
                if audioRecorder.isRecording {
                    WaveformView()
                        .frame(height: 100)
                        .padding()
                } else if isProcessing {
                    ProgressView("Transcribing...")
                        .font(.headline)
                        .padding()
                } else {
                    Image(systemName: "mic.circle.fill")
                        .resizable()
                        .frame(width: 120, height: 120)
                        .foregroundColor(.blue)
                        .opacity(0.6)
                }

                // Status Text
                Text(statusText)
                    .font(.title3)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                // Transcribed Text Display
                if !transcribedText.isEmpty {
                    ScrollView {
                        Text(transcribedText)
                            .font(.body)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                    }
                    .frame(maxHeight: 200)
                    .padding(.horizontal)

                    Button(action: copyToClipboard) {
                        Label("Copy to Clipboard", systemImage: "doc.on.doc")
                            .font(.headline)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .padding(.horizontal)
                }

                Spacer()

                // Record Button
                Button(action: toggleRecording) {
                    ZStack {
                        Circle()
                            .fill(audioRecorder.isRecording ? Color.red : Color.blue)
                            .frame(width: 80, height: 80)
                            .shadow(radius: audioRecorder.isRecording ? 10 : 5)

                        Image(systemName: audioRecorder.isRecording ? "stop.fill" : "mic.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                    }
                }
                .disabled(isProcessing)
                .scaleEffect(audioRecorder.isRecording ? 1.1 : 1.0)
                .animation(.easeInOut(duration: 0.5).repeatForever(autoreverses: true), value: audioRecorder.isRecording)

                Text(audioRecorder.isRecording ? "Tap to stop" : "Tap to record")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()
            }
            .padding()
            .navigationBarItems(
                trailing: Button(action: { showHistory.toggle() }) {
                    Image(systemName: "clock.fill")
                }
            )
            .sheet(isPresented: $showHistory) {
                HistoryView()
            }
        }
    }

    private var statusText: String {
        if audioRecorder.isRecording {
            return "Listening..."
        } else if isProcessing {
            return "Processing audio..."
        } else if transcribedText.isEmpty {
            return "Tap the microphone to start"
        } else {
            return "Text copied! Paste anywhere"
        }
    }

    private func toggleRecording() {
        if audioRecorder.isRecording {
            audioRecorder.stopRecording()
            isProcessing = true

            // Transcribe the audio
            if let audioURL = audioRecorder.audioFileURL {
                transcriptionService.transcribe(audioURL: audioURL) { result in
                    isProcessing = false

                    switch result {
                    case .success(let text):
                        transcribedText = text
                        UIPasteboard.general.string = text

                        // Save to history
                        TranscriptionHistory.shared.add(text)

                    case .failure(let error):
                        transcribedText = "Error: \(error.localizedDescription)"
                    }
                }
            }
        } else {
            audioRecorder.startRecording()
            transcribedText = ""
        }
    }

    private func copyToClipboard() {
        UIPasteboard.general.string = transcribedText
    }
}

// Waveform Animation View
struct WaveformView: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<5) { index in
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.red)
                    .frame(width: 8)
                    .scaleEffect(y: animating ? CGFloat.random(in: 0.3...1.0) : 0.3)
                    .animation(
                        .easeInOut(duration: 0.5)
                        .repeatForever()
                        .delay(Double(index) * 0.1),
                        value: animating
                    )
            }
        }
        .onAppear {
            animating = true
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AudioRecorder())
            .environmentObject(TranscriptionService())
    }
}

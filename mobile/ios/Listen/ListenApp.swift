//
//  ListenApp.swift
//  Listen - Voice to Text
//
//  Main app entry point
//

import SwiftUI

@main
struct ListenApp: App {
    @StateObject private var audioRecorder = AudioRecorder()
    @StateObject private var transcriptionService = TranscriptionService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(audioRecorder)
                .environmentObject(transcriptionService)
        }
    }
}

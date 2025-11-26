const { RecordingManager } = require('./dist/recording.js');
const { ModularTranscriptionService } = require('./dist/transcription-router.js');
const fs = require('fs');

async function testFullPipeline() {
  console.log('🚀 Starting full end-to-end test...\n');

  const mgr = new RecordingManager();
  let transcriptionService = null;

  try {
    // Step 1: Record audio
    console.log('📝 Step 1: Recording audio for 5 seconds...');
    await mgr.startRecording();

    await new Promise(resolve => setTimeout(resolve, 5000));

    const audioPath = await mgr.stopRecording();
    console.log(`✓ Recording saved to: ${audioPath}\n`);

    // Verify file
    const size = fs.statSync(audioPath).size;
    console.log(`📊 Audio file size: ${size} bytes`);

    if (size < 100) {
      throw new Error('Audio file is too small - recording failed');
    }
    console.log('✓ Audio file is valid\n');

    // Step 2: Initialize transcription service
    console.log('⚙️  Step 2: Initializing transcription service...');
    transcriptionService = new ModularTranscriptionService();
    await transcriptionService.initialize();
    console.log('✓ Transcription service initialized\n');

    // Step 3: Transcribe
    console.log('🔄 Step 3: Transcribing audio with Parakeet...');
    const startTime = Date.now();

    const result = await transcriptionService.transcribe(audioPath, {
      routingPreferences: {
        priority: 'balance',
        platform: 'desktop',
        language: 'en'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`✓ Transcription complete in ${duration}ms\n`);

    // Display results
    console.log('📋 RESULTS:');
    console.log('═'.repeat(60));
    console.log(`Transcribed Text: "${result.text}"`);
    console.log(`Model Used: ${result.modelUsed}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Processing Time: ${result.duration}ms`);
    console.log('═'.repeat(60));
    console.log('\n✅ FULL PIPELINE TEST PASSED!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

testFullPipeline();

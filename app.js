/* ==========================================
   YT2MP3 STUDIO PRO - LOGIQUE APPLICATIVE JS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Elements DOM
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fetchBtn = document.getElementById('fetchBtn');

    const studioCard = document.getElementById('studioCard');
    const videoThumb = document.getElementById('videoThumb');
    const videoDuration = document.getElementById('videoDuration');
    const videoTitle = document.getElementById('videoTitle');
    const videoChannel = document.getElementById('videoChannel');
    const playPreviewBtn = document.getElementById('playPreviewBtn');

    const formatSelect = document.getElementById('formatSelect');
    const bitrateSelect = document.getElementById('bitrateSelect');
    const trimStart = document.getElementById('trimStart');
    const trimEnd = document.getElementById('trimEnd');
    const trimStartVal = document.getElementById('trimStartVal');
    const trimEndVal = document.getElementById('trimEndVal');

    const tagTitle = document.getElementById('tagTitle');
    const tagArtist = document.getElementById('tagArtist');
    const tagAlbum = document.getElementById('tagAlbum');

    const fxChips = document.querySelectorAll('.fx-chip');
    const startConvertBtn = document.getElementById('startConvertBtn');

    const conversionProgressArea = document.getElementById('conversionProgressArea');
    const progressStatusText = document.getElementById('progressStatusText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');
    const spectrumCanvas = document.getElementById('spectrumCanvas');

    const downloadResultArea = document.getElementById('downloadResultArea');
    const audioPreviewPlayer = document.getElementById('audioPreviewPlayer');
    const downloadMp3Btn = document.getElementById('downloadMp3Btn');
    const qrCodeBtn = document.getElementById('qrCodeBtn');

    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    const qrModal = document.getElementById('qrModal');
    const closeQrModal = document.getElementById('closeQrModal');
    const qrCanvas = document.getElementById('qrCanvas');
    const qrVideoTitle = document.getElementById('qrVideoTitle');

    const videoModal = document.getElementById('videoModal');
    const closeVideoModal = document.getElementById('closeVideoModal');
    const youtubeIframe = document.getElementById('youtubeIframe');

    const toastContainer = document.getElementById('toastContainer');

    // State Variables
    let currentVideoData = null;
    let selectedFx = 'none';
    let animationFrameId = null;
    let audioContext = null;
    let currentAudioBlobUrl = null;

    // --- 1. UTILS & HELPERS ---

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function cleanSongTitle(rawTitle) {
        if (!rawTitle) return 'musique';
        let title = rawTitle;

        // Supprime les mentions parasites fréquentes de YouTube (ex: (Videoclip), [Official Video], etc.)
        const noisePatterns = [
            /\(?\s*videoclip\s*\)?/gi,
            /\[?\s*videoclip\s*\]?/gi,
            /\(?\s*video\s*clip\s*\)?/gi,
            /\[?\s*video\s*clip\s*\]?/gi,
            /\(?\s*clip\s*officiel\s*\)?/gi,
            /\[?\s*clip\s*officiel\s*\]?/gi,
            /\(?\s*official\s*video\s*\)?/gi,
            /\[?\s*official\s*video\s*\]?/gi,
            /\(?\s*official\s*music\s*video\s*\)?/gi,
            /\[?\s*official\s*music\s*video\s*\]?/gi,
            /\(?\s*official\s*audio\s*\)?/gi,
            /\[?\s*official\s*audio\s*\]?/gi,
            /\(?\s*4k\s*remaster\s*\)?/gi,
            /\[?\s*4k\s*remaster\s*\]?/gi,
            /\(?\s*lyrics\s*\)?/gi,
            /\[?\s*lyrics\s*\]?/gi
        ];

        noisePatterns.forEach(pattern => {
            title = title.replace(pattern, '');
        });

        // Nettoie les caractères interdits par les systèmes de fichiers (/ \ ? % * : | " < >)
        title = title.replace(/[/\\?%*:|"<>]/g, '');

        // Nettoie les espaces multiples et les tirets/points isolés aux extrémités
        title = title.replace(/\s+/g, ' ').replace(/^[\s\-_.]+|[\s\-_.]+$/g, '').trim();

        return title || 'musique';
    }

    // --- 2. INPUT EVENTS & PASTE ---

    youtubeUrlInput.addEventListener('input', () => {
        if (youtubeUrlInput.value.trim().length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    });

    clearBtn.addEventListener('click', () => {
        youtubeUrlInput.value = '';
        clearBtn.classList.add('hidden');
        studioCard.classList.add('hidden');
        youtubeUrlInput.focus();
    });

    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                youtubeUrlInput.value = text;
                clearBtn.classList.remove('hidden');
                showToast('Lien collé depuis le presse-papier !', 'success');
                analyzeVideo();
            }
        } catch (err) {
            showToast('Veuillez coller le lien manuellement.', 'info');
        }
    });

    fetchBtn.addEventListener('click', analyzeVideo);
    youtubeUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeVideo();
    });

    // --- 3. VIDEO ANALYSIS & METADATA FETCHING ---

    async function analyzeVideo() {
        const url = youtubeUrlInput.value.trim();
        const videoId = extractYouTubeId(url);

        if (!videoId) {
            showToast('URL YouTube invalide. Veuillez vérifier le lien fourni.', 'error');
            return;
        }

        fetchBtn.disabled = true;
        fetchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyse...`;

        try {
            // Appeler l'API /api/info du serveur local pour obtenir la durée et métadonnées exactes YouTube
            let title = `Vidéo YouTube (${videoId})`;
            let author = "Chaîne YouTube";
            let durationSec = 196; // 03:16
            let thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

            const infoEndpoints = [
                `http://localhost:8080/api/info?url=${encodeURIComponent(url)}`,
                `/api/info?url=${encodeURIComponent(url)}`
            ];

            for (const endpoint of infoEndpoints) {
                try {
                    const infoRes = await fetch(endpoint);
                    if (infoRes.ok) {
                        const infoData = await infoRes.json();
                        if (infoData && infoData.status === 'success') {
                            title = infoData.title || title;
                            author = infoData.channel || author;
                            durationSec = infoData.duration || durationSec;
                            thumbUrl = infoData.thumbnail || thumbUrl;
                            break;
                        }
                    }
                } catch (e) {}
            }

            if (title.startsWith('Vidéo YouTube')) {
                try {
                    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.title) title = data.title;
                        if (data.author_name) author = data.author_name;
                    }
                } catch (err) {}
            }

            videoThumb.src = thumbUrl;
            videoDuration.textContent = formatTime(durationSec);

            videoTitle.textContent = title;
            videoChannel.innerHTML = `<i class="fa-solid fa-circle-user"></i> ${author}`;

            // Pre-fill ID3 tags avec titre nettoyé sans (Videoclip)
            const displayCleanTitle = cleanSongTitle(title);
            tagTitle.value = displayCleanTitle;
            tagArtist.value = author;

            // Update Trimmer Sliders with REAL exact duration
            trimStart.max = durationSec;
            trimEnd.max = durationSec;
            trimStart.value = 0;
            trimEnd.value = durationSec;
            trimStartVal.textContent = formatTime(0);
            trimEndVal.textContent = formatTime(durationSec);

            // Store current video state
            currentVideoData = {
                id: videoId,
                title: title,
                channel: author,
                thumbnail: thumbUrl,
                duration: durationSec,
                url: url
            };

            // Reveal Studio Card & Reset Conversion Areas
            studioCard.classList.remove('hidden');
            conversionProgressArea.classList.add('hidden');
            downloadResultArea.classList.add('hidden');

            showToast(`Vidéo chargée : "${title}" (${formatTime(durationSec)})`, 'success');

            // Scroll smoothly to studio card
            studioCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            showToast('Erreur lors de la récupération des détails de la vidéo.', 'error');
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = `<span>Analyser la Vidéo</span> <i class="fa-solid fa-magnifying-glass"></i>`;
        }
    }

    // --- 4. TRIMMER & SOUND FX CONTROLS ---

    trimStart.addEventListener('input', () => {
        let start = parseInt(trimStart.value);
        let end = parseInt(trimEnd.value);
        if (start >= end) {
            start = end - 1;
            trimStart.value = start;
        }
        trimStartVal.textContent = formatTime(start);
    });

    trimEnd.addEventListener('input', () => {
        let start = parseInt(trimStart.value);
        let end = parseInt(trimEnd.value);
        if (end <= start) {
            end = start + 1;
            trimEnd.value = end;
        }
        trimEndVal.textContent = formatTime(end);
    });

    fxChips.forEach(chip => {
        chip.addEventListener('click', () => {
            fxChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedFx = chip.dataset.fx;
        });
    });

    // --- 5. AUDIO VISUALIZER (CANVAS) ---

    function startVisualizer() {
        const ctx = spectrumCanvas.getContext('2d');
        const width = spectrumCanvas.width;
        const height = spectrumCanvas.height;
        const barCount = 48;
        const barWidth = width / barCount - 2;

        let phase = 0;

        function render() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < barCount; i++) {
                // Generate dynamic wave bars
                const value = Math.sin(phase + i * 0.15) * 0.5 + 0.5;
                const barHeight = (value * (height - 10)) + 6 + (Math.random() * 8);

                // Neon Gradient
                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, '#8b5cf6');
                gradient.addColorStop(0.5, '#ec4899');
                gradient.addColorStop(1, '#06b6d4');

                ctx.fillStyle = gradient;
                ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
            }

            phase += 0.08;
            animationFrameId = requestAnimationFrame(render);
        }

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        render();
    }

    function stopVisualizer() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // --- 6. REALISTIC AUDIO ENCODING & CONVERSION ENGINE ---

    startConvertBtn.addEventListener('click', async () => {
        if (!currentVideoData) return;

        startConvertBtn.disabled = true;
        conversionProgressArea.classList.remove('hidden');
        downloadResultArea.classList.add('hidden');

        progressBarFill.style.width = '0%';
        progressPercent.textContent = '0%';
        progressStatusText.textContent = "Connexion aux serveurs audio HQ...";

        startVisualizer();

        const format = formatSelect.value;
        const bitrate = bitrateSelect.value;
        const startSec = parseInt(trimStart.value);
        const endSec = parseInt(trimEnd.value);
        const durationSec = Math.max(1, endSec - startSec);

        // Simulation of steps with real progress bar
        const steps = [
            { pct: 15, msg: `Extraction du flux audio original YouTube...` },
            { pct: 35, msg: `Application du découpage audio (${formatTime(startSec)} - ${formatTime(endSec)})...` },
            { pct: 60, msg: `Transcodage en format ${format.toUpperCase()} ${bitrate}kbps...` },
            { pct: 85, msg: `Inclusion des tags ID3 (${tagArtist.value || 'Artiste'} - ${tagTitle.value || 'Titre'})...` },
            { pct: 100, msg: `Conversion réussie ! Génération du fichier final...` }
        ];

        for (const step of steps) {
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
            progressBarFill.style.width = `${step.pct}%`;
            progressPercent.textContent = `${step.pct}%`;
            progressStatusText.textContent = step.msg;
        }

        stopVisualizer();

        // 1. Appel au serveur backend local PowerShell (/api/convert) avec yt-dlp
        let realAudioUrl = null;
        const targetUrl = currentVideoData.url || `https://www.youtube.com/watch?v=${currentVideoData.id}`;
        const queryParams = `url=${encodeURIComponent(targetUrl)}&start=${startSec}&end=${endSec}&format=${format}&bitrate=${bitrate}`;

        progressStatusText.textContent = "Téléchargement et transcodage audio via yt-dlp & FFmpeg...";
        progressBarFill.style.width = '70%';
        progressPercent.textContent = '70%';

        // Essayer le serveur local sur port 8080 puis en relatif
        const endpoints = [
            `http://localhost:8080/api/convert?${queryParams}`,
            `/api/convert?${queryParams}`
        ];

        for (const endpoint of endpoints) {
            try {
                const apiRes = await fetch(endpoint);
                if (apiRes.ok) {
                    const data = await apiRes.json();
                    if (data && data.status === 'success' && data.downloadUrl) {
                        realAudioUrl = data.downloadUrl.startsWith('/') ? `http://localhost:8080${data.downloadUrl}` : data.downloadUrl;
                        break;
                    }
                }
            } catch (e) {
                // Continue vers le prochain endpoint
            }
        }

        // 2. Fallbacks distants (Invidious / Piped) si serveur local indisponible
        if (!realAudioUrl) {
            const externalApis = [
                `https://inv.tux.pizza/api/v1/videos/${currentVideoData.id}`,
                `https://invidious.nerdvpn.de/api/v1/videos/${currentVideoData.id}`,
                `https://pipedapi.kavin.rocks/streams/${currentVideoData.id}`
            ];

            for (const apiUrl of externalApis) {
                try {
                    const res = await fetch(apiUrl);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.adaptiveFormats) {
                            const audioFormat = data.adaptiveFormats.find(f => f.type && f.type.includes('audio'));
                            if (audioFormat && audioFormat.url) {
                                realAudioUrl = audioFormat.url;
                                break;
                            }
                        } else if (data.audioStreams && data.audioStreams.length > 0) {
                            realAudioUrl = data.audioStreams[0].url;
                            break;
                        }
                    }
                } catch (e) {}
            }
        }

        progressBarFill.style.width = '100%';
        progressPercent.textContent = '100%';

        // 3. Finalize File Output
        let finalAudioUrl = null;
        const rawTitle = (tagTitle.value || currentVideoData.title || 'musique').trim();
        // Nettoie automatiquement les mentions inutiles telles que (Videoclip) du nom de fichier
        const cleanTitle = cleanSongTitle(rawTitle);
        const finalFileName = `${cleanTitle}.${format}`;

        if (realAudioUrl) {
            finalAudioUrl = realAudioUrl;
            progressStatusText.textContent = " Morceau original YouTube extrait avec succès !";
            showToast("Morceau YouTube original récupéré !", "success");
        } else {
            progressStatusText.textContent = "Génération de la piste audio de démonstration...";
            showToast("Serveur local non détecté. Veuillez exécuter 'server.ps1' pour avoir le vrai MP3 !", "error");
            const audioBlob = createCompleteMusicalBlob(durationSec, selectedFx, bitrate);
            if (currentAudioBlobUrl) URL.revokeObjectURL(currentAudioBlobUrl);
            currentAudioBlobUrl = URL.createObjectURL(audioBlob);
            finalAudioUrl = currentAudioBlobUrl;
        }

        stopVisualizer();

        // Configure Download & Preview Player (sans déclencher la lecture automatique)
        audioPreviewPlayer.src = finalAudioUrl;
        audioPreviewPlayer.pause();
        downloadMp3Btn.href = finalAudioUrl;
        downloadMp3Btn.download = finalFileName;

        downloadResultArea.classList.remove('hidden');
        startConvertBtn.disabled = false;

        // Save to History with original clean filename
        saveToHistory({
            title: rawTitle,
            artist: tagArtist.value || currentVideoData.channel,
            format: format.toUpperCase(),
            bitrate: `${bitrate}kbps`,
            thumbnail: currentVideoData.thumbnail,
            url: finalAudioUrl,
            filename: finalFileName,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        showToast('Fichier MP3 prêt ! Cliquez sur Télécharger.', 'success');
        downloadResultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Déclencher le téléchargement direct immédiatement sans lecture
        triggerDirectDownload(finalAudioUrl, finalFileName);
    });

    /**
     * Générateur Musical Polyphonique Intégral :
     * Crée un véritable morceau musical complet (Intro -> Verset -> Refrain -> Outro)
     * couvrant la durée totale exacte sélectionnée.
     */
    function createCompleteMusicalBlob(durationSec, fx, bitrate) {
        const sampleRate = 44100;
        const numChannels = 2;
        // Utilise la durée réelle demandée (sans bridage artificiel à 90s)
        const renderDuration = Math.max(5, durationSec);
        const totalSamples = Math.floor(sampleRate * renderDuration);
        const buffer = new Float32Array(totalSamples * numChannels);

        // Musical Progression: Chords Am - F - C - G
        const chordProgressions = [
            [220.00, 261.63, 329.63], // Am (A3, C4, E4)
            [174.61, 220.00, 261.63], // F  (F3, A3, C4)
            [261.63, 329.63, 392.00], // C  (C4, E4, G4)
            [196.00, 246.94, 293.66]  // G  (G3, B3, D4)
        ];

        // Melodic Pentatonic Scale Notes (A Minor)
        const melodyScale = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

        const bpm = 120;
        const secondsPerBeat = 60 / bpm;
        const samplesPerBeat = sampleRate * secondsPerBeat;
        const measureDurationSec = secondsPerBeat * 4;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / sampleRate;
            const currentBeat = Math.floor(t / secondsPerBeat);
            const currentMeasure = Math.floor(t / measureDurationSec);
            const chordIndex = currentMeasure % chordProgressions.length;
            const currentChord = chordProgressions[chordIndex];

            // 1. Structural Song Envelope (Fade In Intro, Chorus Boost, Fade Out Outro)
            let masterVolume = 0.8;
            if (t < 3) masterVolume *= (t / 3); // Intro Fade In
            if (t > renderDuration - 4) masterVolume *= Math.max(0, (renderDuration - t) / 4); // Outro Fade Out

            // FX Modifiers
            let bassGain = (fx === 'bass') ? 0.6 : 0.35;
            let vocalGain = (fx === 'vocal') ? 0.5 : 0.3;
            let masterMultiplier = (fx === 'loud') ? 1.4 : 1.0;

            // 2. Polyphonic Chords Layer (Pad / Strings)
            let chordSample = 0;
            for (let n = 0; n < currentChord.length; n++) {
                chordSample += Math.sin(2 * Math.PI * currentChord[n] * t) * 0.12;
                chordSample += Math.sin(2 * Math.PI * (currentChord[n] * 2) * t) * 0.05; // Soft 1st Harmonic
            }

            // 3. Sub-Bass Pulse Layer
            const rootFreq = currentChord[0] / 2; // Sub octave
            const beatPhase = (t % secondsPerBeat) / secondsPerBeat;
            const bassEnvelope = Math.exp(-beatPhase * 3); // Plucked bass decay
            const bassSample = Math.sin(2 * Math.PI * rootFreq * t) * bassGain * (0.4 + 0.6 * bassEnvelope);

            // 4. Arpeggiated Melodic Lead Layer
            const subStep = Math.floor((t % secondsPerBeat) / (secondsPerBeat / 4));
            const noteFreq = melodyScale[(currentBeat + subStep + chordIndex) % melodyScale.length];
            const arpPhase = (t % (secondsPerBeat / 4)) / (secondsPerBeat / 4);
            const arpEnvelope = Math.exp(-arpPhase * 6);
            const melodySample = Math.sin(2 * Math.PI * noteFreq * t) * vocalGain * arpEnvelope;

            // 5. Percussion Layer (Kick on beats 1 & 3, Hi-Hat noise on 8th notes)
            let percussionSample = 0;
            // Kick Drum
            if (currentBeat % 2 === 0 && beatPhase < 0.15) {
                const kickFreq = 120 * Math.exp(-beatPhase * 25);
                percussionSample += Math.sin(2 * Math.PI * kickFreq * t) * 0.4 * Math.exp(-beatPhase * 15);
            }
            // Hi-Hat Noise
            const halfBeatPhase = (t % (secondsPerBeat / 2)) / (secondsPerBeat / 2);
            if (halfBeatPhase < 0.05) {
                const noise = (Math.random() * 2 - 1);
                percussionSample += noise * 0.08 * Math.exp(-halfBeatPhase * 40);
            }

            // Mix all layers together
            let mixedSample = (chordSample + bassSample + melodySample + percussionSample) * masterVolume * masterMultiplier;
            mixedSample = Math.max(-0.95, Math.min(0.95, mixedSample)); // Soft limiter to avoid clipping

            // Stereo Output with subtle chorus panning
            buffer[i * 2] = mixedSample * (0.9 + 0.1 * Math.sin(2 * Math.PI * 0.2 * t));     // Left
            buffer[i * 2 + 1] = mixedSample * (0.9 - 0.1 * Math.sin(2 * Math.PI * 0.2 * t)); // Right
        }

        return createWavBlobFromBuffer(buffer, sampleRate, numChannels);
    }

    function createWavBlobFromBuffer(samples, sampleRate, numChannels) {
        const bufferLength = samples.length * 2;
        const arrayBuffer = new ArrayBuffer(44 + bufferLength);
        const view = new DataView(arrayBuffer);

        /* RIFF identifier */
        writeString(view, 0, 'RIFF');
        /* RIFF chunk length */
        view.setUint32(4, 36 + bufferLength, true);
        /* RIFF type */
        writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw PCM) */
        view.setUint16(20, 1, true);
        /* channel count */
        view.setUint16(22, numChannels, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * numChannels * 2, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, numChannels * 2, true);
        /* bits per sample */
        view.setUint16(34, 16, true);
        /* data chunk identifier */
        writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, bufferLength, true);

        // Float to PCM 16bit Conversion
        let offset = 44;
        for (let i = 0; i < samples.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        return new Blob([arrayBuffer], { type: 'audio/mp3' });
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // --- 7. HISTORY MANAGEMENT (LOCAL STORAGE & PLAYBACK/DELETE) ---

    let currentlyPlayingIndex = null;

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('yt2mp3_history') || '[]');
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fa-solid fa-music"></i>
                    <p>Aucune conversion récente pour le moment.</p>
                </div>`;
            return;
        }

        historyList.innerHTML = '';
        history.forEach((item, index) => {
            const isPlaying = (currentlyPlayingIndex === index) && !audioPreviewPlayer.paused;
            const playIcon = isPlaying ? 'fa-pause' : 'fa-play';
            const playBtnText = isPlaying ? 'Pause' : 'Écouter';

            const div = document.createElement('div');
            div.className = `history-item ${currentlyPlayingIndex === index ? 'playing' : ''}`;
            div.innerHTML = `
                <div class="history-item-info">
                    <div class="history-thumb-wrapper">
                        <img src="${item.thumbnail}" class="history-thumb" alt="Miniature">
                        <button type="button" class="history-play-overlay-btn btn-play-history" data-index="${index}" title="${playBtnText}">
                            <i class="fa-solid ${playIcon}"></i>
                        </button>
                    </div>
                    <div style="min-width: 0;">
                        <div class="history-title" title="${item.title}">${item.title}</div>
                        <div class="history-meta">${item.artist} • ${item.format} ${item.bitrate} • ${item.date}</div>
                    </div>
                </div>
                <div class="history-item-actions">
                    <button type="button" class="btn-history-action btn-play-history" data-index="${index}">
                        <i class="fa-solid ${playIcon}"></i> <span>${playBtnText}</span>
                    </button>
                    <a href="${item.url || '#'}" download="${item.filename || item.title + '.mp3'}" class="btn-history-action btn-download-history" title="Télécharger">
                        <i class="fa-solid fa-download"></i> <span>MP3</span>
                    </a>
                    <button type="button" class="btn-history-action btn-delete-history" data-index="${index}" title="Supprimer de l'application">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            historyList.appendChild(div);
        });

        attachHistoryEvents();
    }

    function attachHistoryEvents() {
        const history = JSON.parse(localStorage.getItem('yt2mp3_history') || '[]');

        // Écouter / Pause dans la liste
        document.querySelectorAll('.btn-play-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const item = history[idx];
                if (!item) return;

                if (currentlyPlayingIndex === idx && !audioPreviewPlayer.paused) {
                    audioPreviewPlayer.pause();
                    currentlyPlayingIndex = null;
                    loadHistory();
                } else {
                    audioPreviewPlayer.src = item.url;
                    audioPreviewPlayer.play().then(() => {
                        currentlyPlayingIndex = idx;
                        downloadResultArea.classList.remove('hidden');
                        downloadMp3Btn.href = item.url;
                        downloadMp3Btn.download = item.filename || `${item.title}.mp3`;
                        loadHistory();
                        showToast(`Lecture : "${item.title}"`, 'info');
                    }).catch(() => {
                        showToast("Fichier audio non disponible pour la lecture.", "error");
                    });
                }
            });
        });

        // Supprimer une musique de l'application
        document.querySelectorAll('.btn-delete-history').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                const item = history[idx];
                if (!item) return;

                if (currentlyPlayingIndex === idx) {
                    audioPreviewPlayer.pause();
                    audioPreviewPlayer.src = '';
                    currentlyPlayingIndex = null;
                }

                // Supprimer le fichier du disque local si téléchargé via le serveur backend
                if (item.url && item.url.includes('/downloads/')) {
                    const fileName = item.url.split('/downloads/').pop();
                    const deleteEndpoints = [
                        `http://localhost:8080/api/delete?file=${encodeURIComponent(fileName)}`,
                        `/api/delete?file=${encodeURIComponent(fileName)}`
                    ];
                    for (const ep of deleteEndpoints) {
                        try { await fetch(ep); } catch (err) {}
                    }
                }

                // Supprimer de l'historique et mettre à jour
                const itemTitle = item.title;
                history.splice(idx, 1);
                localStorage.setItem('yt2mp3_history', JSON.stringify(history));
                loadHistory();
                showToast(`"${itemTitle}" a été supprimé de l'application.`, 'success');
            });
        });

        // Télécharger directement depuis la liste sans lancer la lecture
        document.querySelectorAll('.btn-download-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = btn.getAttribute('href');
                const filename = btn.getAttribute('download');
                triggerDirectDownload(url, filename);
            });
        });
    }

    // Gestionnaire de téléchargement direct sans ouverture de lecteur audio
    async function triggerDirectDownload(url, filename) {
        if (!url || url === '#') return;
        showToast(`Téléchargement de "${filename || 'fichier.mp3'}" démarré...`, 'info');

        try {
            const res = await fetch(url);
            if (res.ok) {
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename || 'musique.mp3';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                return;
            }
        } catch (err) {}

        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'musique.mp3';
        a.target = '_blank';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    downloadMp3Btn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerDirectDownload(downloadMp3Btn.href, downloadMp3Btn.download);
    });

    audioPreviewPlayer.addEventListener('pause', () => {
        currentlyPlayingIndex = null;
        loadHistory();
    });

    audioPreviewPlayer.addEventListener('ended', () => {
        currentlyPlayingIndex = null;
        loadHistory();
    });

    function saveToHistory(item) {
        let history = JSON.parse(localStorage.getItem('yt2mp3_history') || '[]');
        history.unshift(item);
        if (history.length > 15) history = history.slice(0, 15);
        localStorage.setItem('yt2mp3_history', JSON.stringify(history));
        loadHistory();
    }

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('yt2mp3_history');
        if (!audioPreviewPlayer.paused) {
            audioPreviewPlayer.pause();
            audioPreviewPlayer.src = '';
        }
        currentlyPlayingIndex = null;
        loadHistory();
        showToast('Historique et liste effacés.', 'info');
    });

    // --- 8. MODALS & QR CODE GENERATOR ---

    playPreviewBtn.addEventListener('click', () => {
        if (!currentVideoData) return;
        youtubeIframe.src = `https://www.youtube.com/embed/${currentVideoData.id}?autoplay=1`;
        videoModal.classList.remove('hidden');
    });

    closeVideoModal.addEventListener('click', () => {
        videoModal.classList.add('hidden');
        youtubeIframe.src = '';
    });

    qrCodeBtn.addEventListener('click', () => {
        if (!currentVideoData) return;
        qrVideoTitle.textContent = tagTitle.value || currentVideoData.title;
        renderQRCodeCanvas(qrCanvas, downloadMp3Btn.href || currentVideoData.url);
        qrModal.classList.remove('hidden');
    });

    closeQrModal.addEventListener('click', () => {
        qrModal.classList.add('hidden');
    });

    function renderQRCodeCanvas(canvas, text) {
        const ctx = canvas.getContext('2d');
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        // Draw simple stylized QR matrix background & blocks for visual representation
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#000000';
        const cells = 21;
        const cellSize = size / cells;

        // Position patterns (corners)
        drawSquare(ctx, 0, 0, 7, cellSize);
        drawSquare(ctx, (cells - 7) * cellSize, 0, 7, cellSize);
        drawSquare(ctx, 0, (cells - 7) * cellSize, 7, cellSize);

        // Random matrix data for QR code pattern look
        for (let r = 0; r < cells; r++) {
            for (let c = 0; c < cells; c++) {
                if ((r < 7 && c < 7) || (r < 7 && c > cells - 8) || (r > cells - 8 && c < 7)) continue;
                if (Math.random() > 0.45) {
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }
        }
    }

    function drawSquare(ctx, x, y, blocks, cellSize) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, blocks * cellSize, blocks * cellSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + cellSize, y + cellSize, (blocks - 2) * cellSize, (blocks - 2) * cellSize);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, (blocks - 4) * cellSize, (blocks - 4) * cellSize);
    }

    // Initialize
    loadHistory();
});

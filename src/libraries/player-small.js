/* -*- mode: javascript; tab-width: 4; indent-tabs-mode: nil; -*-
*
* Copyright (c) 2011-2013 Marcus Geelnard
*
* This software is provided 'as-is', without any express or implied
* warranty. In no event will the authors be held liable for any damages
* arising from the use of this software.
*
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
*
* 1. The origin of this software must not be misrepresented; you must not
*    claim that you wrote the original software. If you use this software
*    in a product, an acknowledgment in the product documentation would be
*    appreciated but is not required.
*
* 2. Altered source versions must be plainly marked as such, and must not be
*    misrepresented as being the original software.
*
* 3. This notice may not be removed or altered from any source
*    distribution.
*
*/

"use strict";

// Some general notes and recommendations:
//  * This code uses modern ECMAScript features, such as ** instead of
//    Math.pow(). You may have to modify the code to make it work on older
//    browsers.
//  * If you're not using all the functionality (e.g. not all oscillator types,
//    or certain effects), you can reduce the size of the player routine even
//    further by deleting the code.

class CPlayer {
    constructor() {
        // Array of oscillator functions - bind them to this instance
        this._mOscillators = [
            this._osc_sin.bind(this),
            this._osc_square.bind(this),
            this._osc_saw.bind(this),
            this._osc_tri.bind(this)
        ];
        
        // Private variables set up by init()
        this._mSong = null;
        this._mLastRow = 0;
        this._mCurrentCol = 0;
        this._mNumWords = 0;
        this._mMixBuf = null;
    }
    
    //--------------------------------------------------------------------------
    // Private methods
    //--------------------------------------------------------------------------
    
    // Oscillators
    _osc_sin(value) {
        return Math.sin(value * 6.283184);
    }
    
    _osc_saw(value) {
        return 2 * (value % 1) - 1;
    }
    
    _osc_square(value) {
        return (value % 1) < 0.5 ? 1 : -1;
    }
    
    _osc_tri(value) {
        var v2 = (value % 1) * 4;
        if(v2 < 2) return v2 - 1;
        return 3 - v2;
    }
    
    _getnotefreq(n) {
        // 174.61.. / 44100 = 0.003959503758 (F3)
        return 0.003959503758 * (2 ** ((n - 128) / 12));
    }
    
    _createNote(instr, n, rowLen) {
        var osc1 = this._mOscillators[instr.i[0]],
        o1vol = instr.i[1],
        o1xenv = instr.i[3]/32,
        osc2 = this._mOscillators[instr.i[4]],
        o2vol = instr.i[5],
        o2xenv = instr.i[8]/32,
        noiseVol = instr.i[9],
        attack = instr.i[10] * instr.i[10] * 4,
        sustain = instr.i[11] * instr.i[11] * 4,
        release = instr.i[12] * instr.i[12] * 4,
        releaseInv = 1 / release,
        expDecay = -instr.i[13]/16,
        arp = instr.i[14],
        arpInterval = rowLen * (2 **(2 - instr.i[15]));
        
        var noteBuf = new Int32Array(attack + sustain + release);
        
        // Re-trig oscillators
        var c1 = 0, c2 = 0;
        
        // Local variables.
        var j, j2, e, t, rsample, o1t, o2t;
        
        // Generate one note (attack + sustain + release)
        for (j = 0, j2 = 0; j < attack + sustain + release; j++, j2++) {
            if (j2 >= 0) {
                // Switch arpeggio note.
                arp = (arp >> 8) | ((arp & 255) << 4);
                j2 -= arpInterval;
                
                // Calculate note frequencies for the oscillators
                o1t = this._getnotefreq(n + (arp & 15) + instr.i[2] - 128);
                o2t = this._getnotefreq(n + (arp & 15) + instr.i[6] - 128) * (1 + 0.0008 * instr.i[7]);
            }
            
            // Envelope
            e = 1;
            if (j < attack) {
                e = j / attack;
            } else if (j >= attack + sustain) {
                e = (j - attack - sustain) * releaseInv;
                e = (1 - e) * (3 ** (expDecay * e));
            }
            
            // Oscillator 1
            c1 += o1t * e ** o1xenv;
            rsample = osc1(c1) * o1vol;
            
            // Oscillator 2
            c2 += o2t * e ** o2xenv;
            rsample += osc2(c2) * o2vol;
            
            // Noise oscillator
            if (noiseVol) {
                rsample += (2 * Math.random() - 1) * noiseVol;
            }
            
            // Add to (mono) channel buffer
            noteBuf[j] = (80 * rsample * e) | 0;
        }
        
        return noteBuf;
    }
    
    //--------------------------------------------------------------------------
    // Initialization
    //--------------------------------------------------------------------------
    
    async init(song) {
        return new Promise((resolve) => {
            // Define the song
            this._mSong = song;
            
            // Init iteration state variables
            this._mLastRow = song.endPattern;
            this._mCurrentCol = 0;
            
            // Prepare song info
            this._mNumWords = song.rowLen * song.patternLen * (this._mLastRow + 1) * 2;
            
            // Create work buffer (initially cleared)
            this._mMixBuf = new Int32Array(this._mNumWords);
            
            resolve();
        });
    }
    
    //--------------------------------------------------------------------------
    // Public methods
    //--------------------------------------------------------------------------
    
    // Generate audio data for a single channel
    generateChannel(channelIndex) {
        return new Promise((resolve) => {
            // Local variables
            var i, j, b, p, row, col, n, cp,
            k, t, lfor, e, x, rsample, rowStartSample, f, da;
            
            // Put performance critical items in local variables
            var chnBuf = new Int32Array(this._mNumWords),
            instr = this._mSong.songData[channelIndex],
            rowLen = this._mSong.rowLen,
            patternLen = this._mSong.patternLen;
            
            // Clear effect state
            var low = 0, band = 0, high;
            var lsample, filterActive = false;
            
            // Clear note cache.
            var noteCache = [];
            
            // Patterns
            for (p = 0; p <= this._mLastRow; ++p) {
                cp = instr.p[p];
                
                // Pattern rows
                for (row = 0; row < patternLen; ++row) {
                    // Execute effect command.
                    var cmdNo = cp ? instr.c[cp - 1].f[row] : 0;
                    if (cmdNo) {
                        instr.i[cmdNo - 1] = instr.c[cp - 1].f[row + patternLen] || 0;
                        
                        // Clear the note cache since the instrument has changed.
                        if (cmdNo < 17) {
                            noteCache = [];
                        }
                    }
                    
                    // Put performance critical instrument properties in local variables
                    var oscLFO = this._mOscillators[instr.i[16]],
                    lfoAmt = instr.i[17] / 512,
                    lfoFreq = (2 ** (instr.i[18] - 9)) / rowLen,
                    fxLFO = instr.i[19],
                    fxFilter = instr.i[20],
                    fxFreq = instr.i[21] * 43.23529 * 3.141592 / 44100,
                    q = 1 - instr.i[22] / 255,
                    dist = instr.i[23] * 1e-5,
                    drive = instr.i[24] / 32,
                    panAmt = instr.i[25] / 512,
                    panFreq = 6.283184 * (2 ** (instr.i[26] - 9)) / rowLen,
                    dlyAmt = instr.i[27] / 255,
                    dly = instr.i[28] * rowLen & ~1;  // Must be an even number
                    
                    // Calculate start sample number for this row in the pattern
                    rowStartSample = (p * patternLen + row) * rowLen;
                    
                    // Generate notes for this pattern row
                    for (col = 0; col < 4; ++col) {
                        n = cp ? instr.c[cp - 1].n[row + col * patternLen] : 0;
                        if (n) {
                            if (!noteCache[n]) {
                                noteCache[n] = this._createNote(instr, n, rowLen);
                            }
                            
                            // Copy note from the note cache
                            var noteBuf = noteCache[n];
                            for (j = 0, i = rowStartSample * 2; j < noteBuf.length; j++, i += 2) {
                                chnBuf[i] += noteBuf[j];
                            }
                        }
                    }
                    
                    // Perform effects for this pattern row
                    for (j = 0; j < rowLen; j++) {
                        // Dry mono-sample
                        k = (rowStartSample + j) * 2;
                        rsample = chnBuf[k];
                        
                        // We only do effects if we have some sound input
                        if (rsample || filterActive) {
                            // State variable filter
                            f = fxFreq;
                            if (fxLFO) {
                                f *= oscLFO(lfoFreq * k) * lfoAmt + 0.5;
                            }
                            f = 1.5 * Math.sin(f);
                            low += f * band;
                            high = q * (rsample - band) - low;
                            band += f * high;
                            rsample = fxFilter == 3 ? band : fxFilter == 1 ? high : low;
                            
                            // Distortion
                            if (dist) {
                                rsample *= dist;
                                rsample = rsample < 1 ? rsample > -1 ? this._osc_sin(rsample*.25) : -1 : 1;
                                rsample /= dist;
                            }
                            
                            // Drive
                            rsample *= drive;
                            
                            // Is the filter active (i.e. still audiable)?
                            filterActive = rsample * rsample > 1e-5;
                            
                            // Panning
                            t = Math.sin(panFreq * k) * panAmt + 0.5;
                            lsample = rsample * (1 - t);
                            rsample *= t;
                        } else {
                            lsample = 0;
                        }
                        
                        // Delay is always done, since it does not need sound input
                        if (k >= dly) {
                            // Left channel = left + right[-p] * t
                            lsample += chnBuf[k-dly+1] * dlyAmt;
                            
                            // Right channel = right + left[-p] * t
                            rsample += chnBuf[k-dly] * dlyAmt;
                        }
                        
                        // Store in stereo channel buffer (needed for the delay effect)
                        chnBuf[k] = lsample | 0;
                        chnBuf[k+1] = rsample | 0;
                        
                        // ...and add to stereo mix buffer
                        this._mMixBuf[k] += lsample | 0;
                        this._mMixBuf[k+1] += rsample | 0;
                    }
                }
            }
            
            resolve();
        });
    }
    
    // Generate audio data for all channels asynchronously
    async generate() {
        // Clear the mix buffer
        this._mMixBuf.fill(0);
        
        // Reset current column
        this._mCurrentCol = 0;
        
        // Generate all channels in parallel
        const channelPromises = [];
        for (let i = 0; i < this._mSong.numChannels; i++) {
            channelPromises.push(this.generateChannel(i));
        }
        
        // Wait for all channels to complete
        await Promise.all(channelPromises);
        
        // Mark as complete
        this._mCurrentCol = this._mSong.numChannels;
        
        return 1.0; // All done
    }
    

    
    // Create a AudioBuffer from the generated audio data
    createAudioBuffer(context) {
        var buffer = context.createBuffer(2, this._mNumWords / 2, 44100);
        for (var i = 0; i < 2; i ++) {
            var data = buffer.getChannelData(i);
            for (var j = i; j < this._mNumWords; j += 2) {
                data[j >> 1] = this._mMixBuf[j] / 65536;
            }
        }
        return buffer;
    }
    
    // Create a AudioBuffer from a specific range of the generated audio data
    createAudioBufferRange(context, startIndex = 0, endIndex = null) {
        // Validate and set default end index
        if (endIndex === null || endIndex > this._mNumWords / 2) {
            endIndex = this._mNumWords / 2;
        }
        
        // Ensure start index is valid
        if (startIndex < 0) startIndex = 0;
        if (startIndex >= endIndex) startIndex = endIndex - 1;
        
        // Calculate buffer length
        const bufferLength = endIndex - startIndex;
        
        // Create buffer with the specified length
        var buffer = context.createBuffer(2, bufferLength, 44100);
        
        for (var i = 0; i < 2; i ++) {
            var data = buffer.getChannelData(i);
            for (var j = 0; j < bufferLength; j++) {
                // Map j to the actual sample index in the mix buffer
                var sampleIndex = (startIndex + j) * 2 + i;
                data[j] = this._mMixBuf[sampleIndex] / 65536;
            }
        }
        
        return buffer;
    }
    
    // Create a WAVE formatted Uint8Array from the generated audio data
    createWave() {
        // Create WAVE header
        var headerLen = 44;
        var l1 = headerLen + this._mNumWords * 2 - 8;
        var l2 = l1 - 36;
        var wave = new Uint8Array(headerLen + this._mNumWords * 2);
        wave.set(
            [82,73,70,70,
                l1 & 255,(l1 >> 8) & 255,(l1 >> 16) & 255,(l1 >> 24) & 255,
                87,65,86,69,102,109,116,32,16,0,0,0,1,0,2,0,
                68,172,0,0,16,177,2,0,4,0,16,0,100,97,116,97,
                l2 & 255,(l2 >> 8) & 255,(l2 >> 16) & 255,(l2 >> 24) & 255]
            );
            
            // Append actual wave data
            for (var i = 0, idx = headerLen; i < this._mNumWords; ++i) {
                // Note: We clamp here
                var y = this._mMixBuf[i];
                y = y < -32767 ? -32767 : (y > 32767 ? 32767 : y);
                wave[idx++] = y & 255;
                wave[idx++] = (y >> 8) & 255;
            }
            
            // Return the WAVE formatted typed array
            return wave;
        };
        
        // Create a WAVE formatted Uint8Array from a specific range of the generated audio data
        createWaveRange(startIndex = 0, endIndex = null) {
            // Validate and set default end index
            if (endIndex === null || endIndex > this._mNumWords / 2) {
                endIndex = this._mNumWords / 2;
            }
            
            // Ensure start index is valid
            if (startIndex < 0) startIndex = 0;
            if (startIndex >= endIndex) startIndex = endIndex - 1;
            
            // Calculate buffer length
            const bufferLength = endIndex - startIndex;
            
            // Create WAVE header
            var headerLen = 44;
            var l1 = headerLen + bufferLength * 2 - 8;
            var l2 = l1 - 36;
            var wave = new Uint8Array(headerLen + bufferLength * 2);
            wave.set(
                [82,73,70,70,
                    l1 & 255,(l1 >> 8) & 255,(l1 >> 16) & 255,(l1 >> 24) & 255,
                    87,65,86,69,102,109,116,32,16,0,0,0,1,0,2,0,
                    68,172,0,0,16,177,2,0,4,0,16,0,100,97,116,97,
                    l2 & 255,(l2 >> 8) & 255,(l2 >> 16) & 255,(l2 >> 24) & 255]
                );
                
                // Append actual wave data for the specified range
                for (var i = 0, idx = headerLen; i < bufferLength; ++i) {
                    // Note: We clamp here
                    var y = this._mMixBuf[(startIndex + i) * 2];
                    y = y < -32767 ? -32767 : (y > 32767 ? 32767 : y);
                    wave[idx++] = y & 255;
                    wave[idx++] = (y >> 8) & 255;
                }
                
                // Return the WAVE formatted typed array
                return wave;
            };
        
        // Get n samples of wave data at time t [s]. Wave data in range [-2,2].
        getData(t, n) {
            var i = 2 * Math.floor(t * 44100);
            var d = new Array(n);
            for (var j = 0; j < 2*n; j += 1) {
                var k = i + j;
                d[j] = t > 0 && k < this._mMixBuf.length ? this._mMixBuf[k] / 32768 : 0;
            }
            return d;
        }
}

// Export the class
export default CPlayer;

// Also export as named export for compatibility
export { CPlayer };
    
    
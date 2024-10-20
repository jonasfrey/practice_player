
import {
    f_add_css,
    f_s_css_prefixed,
    o_variables, 
    f_s_css_from_o_variables
} from "https://deno.land/x/f_add_css@2.0.1/mod.js"

import {
    f_o_html__and_make_renderable,
}from 'https://deno.land/x/f_o_html_from_o_js@4.0.3/mod.js'

let o_mod_notifire = await import('https://deno.land/x/f_o_html_from_o_js@4.0.3/localhost/jsh_modules/notifire/mod.js');

import {
    f_o_webgl_program,
    f_delete_o_webgl_program,
    f_resize_canvas_from_o_webgl_program,
    f_render_from_o_webgl_program, 
    f_o_state_webgl_shader_audio_visualization
} from "https://deno.land/x/handyhelpers@5.0.5/mod.js"

import {
    f_s_hms__from_n_ts_ms_utc,
} from "https://deno.land/x/date_functions@1.4/mod.js"

import {
    AbstractFifoSamplePipe,
    PitchShifter,
    RateTransposer,
    SimpleFilter,
    SoundTouch,
    Stretch,
    WebAudioBufferSource,
    getWebAudioNode
}
// from "https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/dist/soundtouch.min.js";
from "./soundtouch.min.js";



let a_o_shader = []
let n_idx_a_o_shader = 0;



let o_state = {
    o_buffer_audio_encoded: null, // Encoded audio data (ArrayBuffer)
    o_buffer_audio_decoded: null, // Decoded audio data (AudioBuffer)
    n_sec_duration: 0,            // Duration of the loaded audio file in seconds
    n_nor_playhead: 0,            // Normalized playhead position (0 to 1)
    o_audio_context: new (window.AudioContext || window.webkitAudioContext)(),
    o_node_source: null,          // Source node
    o_node_script: null,          // Script processor node
    o_sound_touch: null,          // SoundTouch instance
    o_filter: null,               // SoundTouch filter
    b_playing: false,             // Is audio playing
    n_sec_currentTime: 0,         // Current playback time in seconds
    n_cents_pitch: 0,             // Pitch adjustment in cents
    n_nor_tempo: 1.0,             // Normalized tempo (1.0 = normal speed)
    n_seconds_zoom_range: 5,
    n_id_raf_playing: 0, 
    a_n_f32_sample_channel0: new Float32Array(),
    a_n_f32_sample_channel1: new Float32Array(),
    o_audio_buffer: null,
    o_webgl_program: null,
    o_audio_context_source: null,
    o_el_img: null,
    o_audio: null,
    o_shader: {},
    o_state_notifire: {},
    n_idx_a_o_shader,
    a_o_shader,
    a_n_f32_audio_data_channel0: new Float32Array(),
    n_playhead_nor_global: 0., 
    n_playhead_nor_local: 0.,
    o_state_shader_audio_visualization: null,
    o_state_shader_audio_visualization_zoomed: null,
    n_samples_per_second_samplerate:null,
    n_samples_total:null,
    n_num_of_channels:null,
}

window.o_state = o_state
o_variables.n_rem_font_size_base = 1. // adjust font size, other variables can also be adapted before adding the css to the dom
o_variables.n_rem_padding_interactive_elements = 0.5; // adjust padding for interactive elements 
f_add_css(
    `
    
    body{
        min-height: 100vh;
        min-width: 100vw;
        /* background: rgba(0,0,0,0.84);*/
        display:flex;
        justify-content:center;
        align-items:flex-start;
    }
    
   
    button:disabled, button.disabled{
        background: rgb(30, 30, 30);
        color: rgb(20,20,20);
    }
    .player{
        width: 80vw;
        max-width: 1000px;
    }
    .playhead{
        width: 100%;
        display:flex; 
        flex-direction:row;
        align-items: center;
        justify-content: space-between;
    }
    .playhead input{
        width:100%;
        flex-grow:1;
    }
    .waveform_zoomed{
        aspect-ratio:2/1;
    }
    .waveform{
        aspect-ratio:10/1;
    }
    .waveform_zoomed, .waveform{
        position:relative;
    }
    .waveform_zoomed canvas, .waveform canvas{
        position:absolute; 
        top:0;
        left: 0;
        width:100%;
        height: 100%;
    }
    ${
        f_s_css_from_o_variables(
            o_variables
        )
    }
    `
);




let f_delete_audio_stuff = function(){
    f_pause_audio();
    if (o_state.o_buffer_audio_encoded) {
    o_state.o_buffer_audio_encoded = null;
    }
    if (o_state.o_buffer_audio_decoded) {
    o_state.o_buffer_audio_decoded = null;
    }
    if (o_state.o_node_source) {
    o_state.o_node_source = null;
    }
    o_state.o_sound_touch = null;
    o_state.o_filter = null;
    o_state.n_sec_currentTime = 0;
    o_state.n_nor_playhead = 0;
    o_state.n_sec_duration = 0;
    console.log('Audio data deleted.');
}
// Load audio from buffer (encoded audio data)
let f_load_audio_from_o_buffer_audio_encoded = async function(o_buffer_audio_encoded) {
    f_delete_audio_stuff();
    o_state.o_buffer_audio_encoded = o_buffer_audio_encoded;
    try {
        const buffer = await o_state.o_audio_context.decodeAudioData(o_buffer_audio_encoded);
        o_state.o_buffer_audio_decoded = buffer;
        o_state.n_sec_duration = buffer.duration;
        o_state.n_samples_per_second_samplerate = o_buffer_decoded_audio.sampleRate; 
        o_state.n_samples_total = o_buffer_decoded_audio.length; 
        o_state.n_num_of_channels = o_buffer_decoded_audio.numberOfChannels;
        console.log('Audio data loaded. Duration:', o_state.n_sec_duration, 'seconds');
    } catch (error) {
        console.error('Error decoding audio data:', error);
    }
}


let f_raf_playing = async function(){

    o_state.n_playhead_nor_global = o_state.o_state_shader_audio_visualization.o_audio_context.currentTime/ o_state.n_sec_duration;

    await o_state.o_js__playhead._f_render();


    let n_nor_range = o_state.n_seconds_zoom_range / o_state.n_sec_duration;
    let n_nor_playhead = 0.5;
    let n_diff_glob = (o_state.n_playhead_nor_global-(n_nor_range*n_nor_playhead));
    if(n_diff_glob < 0.){
        n_nor_playhead = o_state.n_playhead_nor_global / n_nor_range;
    }

    o_state.o_state_shader_audio_visualization_zoomed.n_nor_start = Math.max(0, o_state.n_playhead_nor_global-(n_nor_range*n_nor_playhead)); 
    o_state.o_state_shader_audio_visualization_zoomed.n_nor_end = o_state.o_state_shader_audio_visualization_zoomed.n_nor_start + n_nor_range;
    o_state.o_state_shader_audio_visualization_zoomed.b_show_playhead = true;
    o_state.o_state_shader_audio_visualization_zoomed.n_nor_playhead = n_nor_playhead;
    o_state.o_state_shader_audio_visualization_zoomed.f_render();


    o_state.o_state_shader_audio_visualization.b_show_playhead = true;
    o_state.o_state_shader_audio_visualization.n_nor_playhead = o_state.n_playhead_nor_global;
    o_state.o_state_shader_audio_visualization.f_render();

    o_state.n_id_raf_playing = requestAnimationFrame(f_raf_playing);
}

let f_o_assigned = function (s_name, v, o_to_assign_to = o_state) {
    let o = {};
    if (typeof v.f_o_jsh == "function") {
      o = v;
    } else {
      if (typeof v == "function") {
        o.f_o_jsh = v;
      } else {
        o.f_o_jsh = function () {
          return v;
        };
      }
    }
    return Object.assign(o_to_assign_to, {
      [s_name]: o,
    })[s_name];
  };
  


// Shift pitch by n cents
function f_shift_pitch(n_cents) {
    o_state.n_cents_pitch = parseFloat(n_cents);
    let semitones = o_state.n_cents_pitch / 100;
    let pitch = Math.pow(2, semitones / 12);
    if (o_state.o_sound_touch) {
        o_state.o_sound_touch.pitch = pitch;
    }
}

// Change tempo (normalized)
let f_change_tempo = function(n_normalized) {
    o_state.n_nor_tempo = parseFloat(n_normalized);
    if (o_state.o_sound_touch) {
        o_state.o_sound_touch.tempo = o_state.n_nor_tempo;
    }
}
      
// Play audio from a specific offset
let f_play_audio = function(n_second_offset) {
    if (!o_state.o_buffer_audio_decoded) {
      console.error('Audio buffer is not loaded.');
      return;
    }

    if (o_state.b_playing) {
      f_pause_audio();
    }

    // Create a new SoundTouch instance
    o_state.o_sound_touch = new SoundTouch(o_state.o_audio_context.sampleRate);
    f_shift_pitch(o_state.n_cents_pitch); // Apply current pitch
    f_change_tempo(o_state.n_nor_tempo);  // Apply current tempo

    // Create source and filter
    let source = new WebAudioBufferSource(o_state.o_buffer_audio_decoded);
    o_state.o_filter = new SimpleFilter(source, o_state.o_sound_touch);

    // Set the position to start from (in samples)
    source.position = n_second_offset * o_state.o_audio_context.sampleRate;

    // Create script processor
    o_state.o_node_script = o_state.o_audio_context.createScriptProcessor(4096, 0, 2);

    o_state.o_node_script.onaudioprocess = function(event) {
      let left = event.outputBuffer.getChannelData(0);
      let right = event.outputBuffer.getChannelData(1);

      let framesExtracted = o_state.o_filter.extract(4096);

      if (framesExtracted === 0) {
        // End of audio
        o_state.o_node_script.disconnect();
        o_state.o_node_script = null;
        o_state.b_playing = false;
        o_state.n_sec_currentTime = 0;
        o_state.n_nor_playhead = 0;
        return;
      }

      let samples = o_state.o_filter.outputBuffer;
      for (let i = 0; i < framesExtracted * 2; i += 2) {
        left[i / 2] = samples[i];
        right[i / 2] = samples[i + 1];
      }

      // Update current time and normalized playhead
      o_state.n_sec_currentTime += (framesExtracted / o_state.o_audio_context.sampleRate) / o_state.n_nor_tempo;
      o_state.n_nor_playhead = o_state.n_sec_currentTime / o_state.n_sec_duration;
    };

    // Connect script node to destination
    o_state.o_node_script.connect(o_state.o_audio_context.destination);

    o_state.b_playing = true;
  };
// Pause audio playback
let f_pause_audio = function() {
    if (o_state.b_playing && o_state.o_node_script) {
        o_state.o_node_script.disconnect();
        o_state.o_node_script = null;
        o_state.b_playing = false;
    }
}


document.body.appendChild(
    await f_o_html__and_make_renderable(
        {

            a_o: [
                {
                    f_after_f_o_html__and_make_renderable:(o)=>{
                        o_state.o_el_img = o
                    },
                    f_o_jsh:()=>{
                        return {
                            s_tag: "img", 
                        }
                    }
                },
                
                {
                    class: "player", 
                    a_o: [
                        {
                            s_tag: "input", 
                            type: "file",
                            oninput: async (o_e)=>{
                                
                                if(o_state?.o_state_shader_audio_visualization?.o_audio_context){
                                    await o_state.o_state_shader_audio_visualization.o_audio_context.close()
                                    o_state.o_audio_context_source.stop();
                                    o_state.o_audio_context_source.disconnect(); // Clean up to prevent memory leaks
                                    
                                }
                                if(o_state.o_state_shader_audio_visualization){
                                    o_state.o_state_shader_audio_visualization.f_delete_webgl_stuff();
                                    o_state.o_state_shader_audio_visualization = null;
                                }
                                if(o_state.o_state_shader_audio_visualization_zoomed){
                                    o_state.o_state_shader_audio_visualization_zoomed.f_delete_webgl_stuff();
                                    o_state.o_state_shader_audio_visualization_zoomed = null;
                                }
                                
                                await o_state.o_js__playpause._f_render();
                                const file = o_e.target.files[0];
                                
                                if (file) {
                                    const reader = new FileReader();
                            
                                    reader.onload = async function(e) {
                                        const o_array_buffer_encoded_audio_data = e.target.result;
                                        await f_load_audio_from_o_buffer_audio_encoded(o_array_buffer_encoded_audio_data);

                                        
                                        let o_el_waveform_zoomed = document.querySelector('.waveform_zoomed');
                                        let o_el_waveform = document.querySelector('.waveform');
                                        o_state.o_state_shader_audio_visualization = await f_o_state_webgl_shader_audio_visualization({
                                            a_n_f32_audio_sample:o_state.o_buffer_audio_decoded.getChannelData(0),
                                            n_scl_x_canvas : o_el_waveform?.clientWidth,
                                            n_scl_y_canvas : o_el_waveform?.clientHeight, 
                                            a_n_rgba_color_amp_peaks: [1., 0, 0, 1.],
                                            a_n_rgba_color_amp_avg: [1, 1, 0, 1], 
                                        }); 
                                        o_state.o_state_shader_audio_visualization.o_canvas.onclick = function(o_e){
                                            let n_x = o_e.clientX;
                                            let o_rect = o_e.target.getBoundingClientRect();
                                            let n_trn_x_nor = (o_e.clientX - o_rect.left)/o_rect.width;
                                            n_trn_x_nor = Math.max(0., Math.min(n_trn_x_nor, 1.));
                                            o_state.n_playhead_nor_global = n_trn_x_nor;
                                            f_pause_audio();
                                            f_play_audio(o_state.n_playhead_nor_global*o_state.n_sec_duration);
                                        }
                                        o_state.o_state_shader_audio_visualization_zoomed = await f_o_state_webgl_shader_audio_visualization({
                                            a_n_f32_audio_sample:o_state.o_buffer_audio_decoded.getChannelData(0),
                                            n_scl_x_canvas : o_el_waveform_zoomed?.clientWidth,
                                            n_scl_y_canvas : o_el_waveform_zoomed?.clientHeight, 
                                            a_n_rgba_color_amp_peaks: [1., 0, 0, 1.],
                                            a_n_rgba_color_amp_avg: [1, 1, 0, 1]
                                        }); 

                                        await Promise.all(
                                            [
                                                o_state.o_js__playpause._f_render(),
                                                o_state.o_js__playhead._f_render(),
                                            ]
                                        );

                                        o_el_waveform.innerHTML = '';
                                        o_el_waveform_zoomed.innerHTML = '';
                                        o_el_waveform?.appendChild(o_state.o_state_shader_audio_visualization.o_canvas);
                                        o_el_waveform_zoomed?.appendChild(o_state.o_state_shader_audio_visualization_zoomed.o_canvas);
                                        
                                        let n_nor_range = o_state.n_seconds_zoom_range / o_state.n_sec_duration;

                                        o_state.o_state_shader_audio_visualization_zoomed.n_nor_start = 0.0; 
                                        o_state.o_state_shader_audio_visualization_zoomed.n_nor_end = o_state.o_state_shader_audio_visualization_zoomed.n_nor_start + n_nor_range;
                                        o_state.o_state_shader_audio_visualization_zoomed.b_show_playhead = true;
                                        o_state.o_state_shader_audio_visualization_zoomed.n_nor_playhead = 0.5;
                                        o_state.o_state_shader_audio_visualization_zoomed.f_render();
                                        o_state.o_state_shader_audio_visualization_zoomed.n_amp_peaks = 0.8;
                                        o_state.o_state_shader_audio_visualization_zoomed.n_amp_avgrms = 0.6;
                                        // globalThis.onmousemove = function(o_e){
                                        //     let n_y_nor = o_e.clientY/ globalThis.innerHeight;
                                        //     let n_x_nor = o_e.clientX/ globalThis.innerWidth;
                            
                                        //     o_state.n_amp_peaks = n_y_nor;
                                        //     o_state.n_amp_avgrms = n_y_nor*0.5;
                                        //     o_state.n_nor_start = 0.0
                                        //     o_state.n_nor_end = n_x_nor;
                                        //     o_state.f_render();
                                        // }

                                     
        
                                    };
                            
                                    reader.readAsArrayBuffer(file);  // Read the file as an ArrayBuffer
                                }
                                    
        
                            }
                        },
                        f_o_assigned(
                            'o_js__playhead', 
                            ()=>{
                                return {
                                    class: "playhead", 
                                    a_o: [
                                        {
                                            innerText: (o_state?.o_state_shader_audio_visualization?.o_audio_context?.currentTime) ? 
                                                [
                                                    parseInt((o_state?.o_state_shader_audio_visualization?.o_audio_context?.currentTime)/60.).toString().padStart(2, '0'), 
                                                    parseInt((o_state?.o_state_shader_audio_visualization?.o_audio_context?.currentTime%60.)).toString().padStart(2, '0')
                                                ].join(':')
                                                : "00:00"
                                        },
                                        {
                                            s_tag: "input", 
                                            type: "range", 
                                            min: 0.,
                                            step: 0.001,
                                            max: 1.,
                                            value: (o_state?.o_state_shader_audio_visualization?.o_audio_context?.currentTime) ? 
                                            (o_state?.o_state_shader_audio_visualization?.o_audio_context?.currentTime / o_state.n_sec_duration) : 0.,
                                            onclick: (o_e)=>{
                                                let slider = o_e.target;

                                                const sliderRect = slider.getBoundingClientRect();  // Get slider's dimensions
                                                const clickPosition = o_e.clientX - sliderRect.left;  // Get the click position
                                                const sliderWidth = sliderRect.width;
                                                
                                                // Calculate the value based on the click position
                                                const min = parseFloat(slider.min);
                                                const max = parseFloat(slider.max);
                                                const clickValue = min + (clickPosition / sliderWidth) * (max - min);
                                                // o_state.o_state_shader_audio_visualization.o_audio_context.currentTime
                                                console.log(clickValue)
                                                o_state.n_playhead_nor_global = clickValue;
                                                console.log(o_state.n_playhead_nor_global)
                                                f_play_audio(o_state.n_playhead_nor_global*o_state.n_sec_duration);

                                            }
                                        }, 
                                        {
                                            innerText: (o_state.n_sec_duration) ? 
                                            [
                                                parseInt((o_state.n_sec_duration)/60.).toString().padStart(2, '0'), 
                                                parseInt((o_state.n_sec_duration%60.)).toString().padStart(2, '0')
                                            ].join(':')
                                            : "00:00"

                                        }
                                    ]
                                }
                            },
                            o_state
                        ),
                        f_o_assigned(
                            'o_js__playpause', 
                            ()=>{
                                let b_disabled = (!o_state.o_state_shader_audio_visualization);
                                console.log(o_state.o_audio_context_source)
                                let o_disabled = (b_disabled) ? {disabled: true, class: "disabled"} : {};
                                return {
                                    class: "playpause", 
                                    a_o: [
                                        {
                                            ...o_disabled,
                                            s_tag: "button", 
                                            innerText: "play", 
                                            onclick: ()=>{
                                                f_play_audio(o_state.n_playhead_nor_global*o_state.n_sec_duration);
                                            }
                                        }, 
                                        {
                                            ...o_disabled,
                                            s_tag: "button", 
                                            innerText: "pause", 
                                            onclick: ()=>{
                                                f_pause_audio();
                                            }
                                        }, 
                                    ]
                                }
                            },
                            o_state, 
                        ), 
                        {
                            class: 'waveform_zoomed',
                        },
                        {
                            class: "waveform"
                        }
                    ]
                },
                o_mod_notifire.f_o_js(
                    o_state.o_state_notifire
                ),
                
            ]
        }
    )
)
o_mod_notifire.f_o_throw_notification(o_state.o_state_notifire,'hello!')

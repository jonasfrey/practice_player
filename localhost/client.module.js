
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


let a_o_shader = []
let n_idx_a_o_shader = 0;



let o_state = {
    n_seconds_zoom_range: 5,
    n_id_raf_playing: 0, 
    b_playing: false, 
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
    n_sec_duration:null,
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





// Determine the current domain
const s_hostname = window.location.hostname;

// Create the WebSocket URL, assuming ws for http and wss for https
const s_protocol_ws = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const s_url_ws = `${s_protocol_ws}//${s_hostname}:${window.location.port}`;

// Create a new WebSocket instance
const o_ws = new WebSocket(s_url_ws);

// Set up event listeners for your WebSocket
o_ws.onopen = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onopen called'
    })
};

o_ws.onerror = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onerror called'
    })
};

o_ws.onmessage = function(o_e) {
    console.log({
        o_e, 
        s: 'o_ws.onmessage called'
    })
    o_state.a_o_msg.push(o_e.data);
    o_state?.o_js__a_o_mod?._f_render();

};
window.addEventListener('pointerdown', (o_e)=>{
    o_ws.send('pointerdown on client')
})

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
  
// let f_play_at_seconds = function(n_seconds){
//         if(o_state.o_audio_context_source){
//             o_state.o_audio_context_source.stop();
//         }
//         // Function to skip to a specific time in the audio
//     function skipTo(timeInSeconds) {
//         if (audioBuffer) {
//             if (currentSource) {
//                 currentSource.stop();  // Stop the current audio
//             }
            
//             // Start playing from the specified time
//             playAudio(timeInSeconds);
//         }
//     }
// }


let f_play_audio = function(n_sec_start){
    cancelAnimationFrame(o_state.n_id_raf_playing);

    if(!o_state.o_audio_context_source){
        // Create a buffer source for the new audio
        o_state.o_audio_context_source = o_state.o_state_shader_audio_visualization.o_audio_context.createBufferSource();
        o_state.o_audio_context_source.buffer = o_state.o_state_shader_audio_visualization.o_audio_buffer;
        // Connect the source to the AudioContext's destination (the speakers)
        o_state.o_audio_context_source.connect(o_state.o_state_shader_audio_visualization.o_audio_context.destination);

        console.log(o_state.n_playhead_nor_global*o_state.n_sec_duration)
        o_state.o_audio_context_source.start(0, n_sec_start);
        o_state.n_id_raf_playing = requestAnimationFrame(f_raf_playing);
    }
}
o_state.f_play_audio = f_play_audio
let f_pause_audio = function(){
    o_state.n_playhead_nor_global = o_state.o_state_shader_audio_visualization.o_audio_context.currentTime / o_state.n_sec_duration;
    console.log(o_state.n_playhead_nor_global);
    if (o_state.o_audio_context_source) {
        o_state.o_audio_context_source.stop();  // Stop the current audio playback
        o_state.o_audio_context_source.disconnect();  // Optionally, disconnect to clean up
        o_state.o_audio_context_source = null;  // Reset the currentSource reference
    }
    cancelAnimationFrame(o_state.n_id_raf_playing);
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
                                        let o_el_waveform_zoomed = document.querySelector('.waveform_zoomed');
                                        let o_el_waveform = document.querySelector('.waveform');
                                        o_state.o_state_shader_audio_visualization = await f_o_state_webgl_shader_audio_visualization({
                                            o_array_buffer_encoded_audio_data,
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
                                            a_n_f32_audio_sample:o_state.o_state_shader_audio_visualization.a_n_f32_audio_sample,
                                            n_scl_x_canvas : o_el_waveform_zoomed?.clientWidth,
                                            n_scl_y_canvas : o_el_waveform_zoomed?.clientHeight, 
                                            a_n_rgba_color_amp_peaks: [1., 0, 0, 1.],
                                            a_n_rgba_color_amp_avg: [1, 1, 0, 1]
                                        }); 
                                        o_state.n_sec_duration = o_state.o_state_shader_audio_visualization.o_audio_buffer.duration; 
                                        o_state.n_samples_per_second_samplerate = o_state.o_state_shader_audio_visualization.o_audio_buffer.sampleRate; 
                                        o_state.n_samples_total = o_state.o_state_shader_audio_visualization.o_audio_buffer.length; 
                                        o_state.n_num_of_channels = o_state.o_state_shader_audio_visualization.o_audio_buffer.numberOfChannels;

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

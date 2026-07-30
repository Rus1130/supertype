typewriter: {
    charDelay: 80
    newlineDelay: 150
    textColor: #ffffff
    backgroundColor: #000000
    customDelays: {
        ",": 500
    }
}
[function "jitterlerp" "this is a custom function that lerps!" 1 20][newline]
WOW! this is normal text![newline]
Normal text, but different, because delay, see? cool[linebreak]

i just used a linebreak there. smirk[newline]

[tab 4]tabbed[newline]

wowwwww[removelast 7]bet ya didnt see that[newline]

time to sleep... [sleep 2000]sleepy...[newline]

[speed 1]SO FAST!!!![speeddefault] back to normal speed.[newline]

periods are gonna be super slow now[custom "." 1000]... see?[newline]

[customremove "."]......not anymore![newline]

[instant]
INSTANT![newline]
INSTANT![newline]
lorem ipsum dolor sit amet ur mom[newline]
[instant off]no more instant[newline]

[ignore]comma custom delay ignored, because i used an ignore tag, so it ignores all custom delays,  sigma[newline]
[ignore off]comma custom delay is back, because i used an ignore off tag, so it ignores all custom delays, super sigma[newline]

[color #339900]green text[color reset][newline]

not green anymore, but now [bg #339900]green background[bg reset][newline]

[color #ff0000][bg #339900]red text on green background[color reset][bg reset][newline]

[raw]
everything is now RAW
[newline][newline] see how nothing works
even newlines that are present in the file are here, super
[raw end][newline]
back to normal

[page "hi"]
wow look! its a page! cool![sleep 10000] yeah ur stuck here bud. gotta reload
[page end]

[linebreak][gopage "hi" "click me if u want idk"][newline]
/italic/[newline]
*bold*[newline]
-strikethrough-[newline]
_underline_[newline]
/*multi/_p-le_-*[newline]

[glitch 10][newline]
[glitch 10 keep][newline]

[jitter "oooh wiggly" 10][newline]

[jitter "its all at the same time, instantly!" 10 keep][newline]

[jitter "it types it, but they jitter the same" 10 shared][newline]

[function "jitterlerp" "this is a custom function that lerps!" 1 20][newline]
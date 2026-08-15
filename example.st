typewriter: {
    charDelay: 40
    newlineDelay: 120
    textColor: #ffffff
    backgroundColor: #000000
    customDelays: {
        ",": 500
    }
}

[@import]
    importExample.st
[@import end]

[$scroll]
[$separate]
[$separate off]
[$instant]
[$instant off]
[$page "hi"]
[$page "hi" keep]
[$start]

[speed none]

[instant]wow[instant off][newline]
[instant on]wow[instant off][newline]

WOW! this is normal text![newline]
    normally lines cannot start with whitespace.
newlines dont do anything either![newline]
Normal text, but different, because delay, see? cool[linebreak]
i just used a linebreak there. smirk[newline]
[swap]
[tab 4]tabbed![newline]
[tab 4 fill]tabbed with background color![newline]
[swap]
wowwwww[removelast 7 group]bet ya didnt see that[newline]
type and delete[removelast 15][newline]
time to sleep... [sleep 2000]sleepy...[newline]
[speed 1]SO FAST!!!![speeddefault] back to normal speed.[newline]
periods are gonna be super slow now[custom "." 1000]... see?[newline]
[customremove "."]......not anymore![newline]
[repeat "repeat" 3][newline]
[repeat 3]
    I can repeat /so many/ things![newline]
[repeat end][linebreak]
[instant]
INSTANT![newline]
INSTANT![newline]
lorem ipsum dolor sit amet ur mom[newline]
[instant off]no more instant[linebreak]

[ignore]comma custom delay ignored, because i used an ignore tag, so it ignores all custom delays, sigma[newline]
[ignore off]comma custom delay is back, because i used an ignore off tag, so it ignores all custom delays, super sigma[linebreak]

[color #339900]green text[color reset][newline]
not green anymore, but now [bg #339900]green background[bg reset][newline]
[color #ff0000][bg #339900]red text on green background[newline]
[swap]swapped the colors![resetcolors][newline]
[gradient "Gradient!!!!" "90deg, #ff0000, #339900"][linebreak]

[raw]everything is now RAW
    [newline][newline] see how nothing works
even ne/wlines /that are present in the file are here, super
nooooooooooooooooooooooooooooooooooooooooo wooooooooooooooooooooooooooooooooooooooooooord wraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaap[raw end][linebreak]
{{# [color #fc7d0e]comment[color reset][linebreak] #}}

[page "hi"]
wow look! its a page! cool![sleep 10000] yeah ur stuck here bud. gotta reload
[page end]

[gopage "hi" "click me if u want idk"][newline]
/italic/[newline]
*bold*[newline]
-strikethrough-[newline]
_underline_[newline]
*_mu*lt-i_/p-l/e[linebreak]

[glitch 10][newline]
[glitch 10 group][newline] {{# works #}}
[unscramble "unscramble!" 1000][newline]
[unscramble "unscramble!" 1000 2000][newline]
[jitter "oooh wiggly" 10][newline] 
[jitter "its all at the same time for the price of 1 character delay!" 10 group][newline] {{# works #}}
[jitter "it types it, but they jitter the same" 10 shared][newline]
[function "jitterlerp" "this is a custom function that lerps!" 1 20][linebreak]

[mixin "cool mixin"]
    [color #339900]<String>[color reset] [jitter <String> <Number>][newline]
[mixin end]

[@use "cool mixin" "these" "are examples" 10]
[@use "cool mixin" "of" "mixins!" 20][newline]

[gopage "importExample-page" "imported page"]
[@use "imported-mixin" "cool"]
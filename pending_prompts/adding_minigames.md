I want to add the possibility for the spanish version of wordle:
https://lapalabradeldia.com/

Also for each of the minigames, add a link to them.

We will start by adding a parser for this minigame:
here is the content of the dark version:
La palabra del día #1614 3/6

⬛🟩⬛⬛🟨
⬛⬛⬛🟩🟩
🟩🟩🟩🟩🟩

https://lapalabradeldia.com/

And the light version:
La palabra del día #1614 3/6

⬜🟩⬜⬜🟨
⬜⬜⬜🟩🟩
🟩🟩🟩🟩🟩

https://lapalabradeldia.com/

When we click in the share button, it should let us select this app.

When sharing to the app it should:

Detect that its this minigame.
Find the groups that have this minigame assigned.

Add the result to that group.
If no group is found, tell them: You dont have any group with this minigame. Please add this minigame to a group or create a new group with this minigame.

If the parser doesnt detect the minigame then tell them: "Failed to parse the minigame. Please try again."

When the user successfully adds a result to one or more of their groups for the first time in the day, we should show an animation showing that his streak increased by 1.

This is the new york times version:
Wordle 1,815 6/6

⬛⬛⬛⬛⬛
⬛⬛🟨⬛⬛
⬛⬛⬛🟨⬛
🟩🟩⬛⬛🟩
🟩🟩⬛⬛🟩
🟩🟩🟩🟩🟩
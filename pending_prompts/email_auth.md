Our app doesnt have a correct email auth.

It only allows us to put the email and not the password.
When registering add a field for password confirmation (a 2nd password input)

The flow goes as follows:

The user registers
An email is sent to their inbox to verify the email
When the email is verified they are allowed to log in.

So we have to:
When they register, tell them to go to their inbox and verify the email.
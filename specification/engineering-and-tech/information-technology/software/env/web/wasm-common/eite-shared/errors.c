int errorStatus = 0;

int die() {
    errorStatus = 1; /* All calls need to call checkForError exactly once afterwards. */
}

EXPORT int checkForError() {
    int errorTemp = errorStatus;
    errorStatus = 0;
    return errorTemp;
}

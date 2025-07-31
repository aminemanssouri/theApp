export const reducer = (state, action) => {
    const { validationResult, inputId, inputValue, type, inputValues, inputValidities, formIsValid } = action

    // Handle UPDATE_FORM action for updating entire form state
    if (type === 'UPDATE_FORM') {
        return {
            inputValues: inputValues || state.inputValues,
            inputValidities: inputValidities || state.inputValidities,
            formIsValid: formIsValid !== undefined ? formIsValid : state.formIsValid,
        }
    }

    const updatedValues = {
        ...state.inputValues,
        [inputId]: inputValue,
    }

    const updatedValidities = {
        ...state.inputValidities,
        [inputId]: validationResult,
    }

    let updatedFormIsValid = true

    for (const key in updatedValidities) {
        if (updatedValidities[key] !== undefined) {
            updatedFormIsValid = false
            break
        }
    }

    return {
        inputValues: updatedValues,
        inputValidities: updatedValidities,
        formIsValid: updatedFormIsValid,
    }
}
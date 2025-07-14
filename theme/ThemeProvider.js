import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { lightColors, darkColors } from './colors'

export const ThemeContext = createContext({
    dark: false,
    colors: lightColors,
    setScheme: () => {},
})

export const ThemeProvider = (props) => {
    const colorScheme = useColorScheme()
    const [isDark, setIsDark] = useState(colorScheme === 'dark')

    useEffect(() => {
        setIsDark(colorScheme === 'dark')
    }, [colorScheme])

    const defaultTheme = useMemo(() => ({
        dark: isDark,
        colors: isDark ? darkColors : lightColors,
        setScheme: (scheme) => setIsDark(scheme === 'dark'),
    }), [isDark])

    return (
        <ThemeContext.Provider value={defaultTheme}>
            {props.children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
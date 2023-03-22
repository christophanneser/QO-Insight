import React from 'react';
import {createTheme} from "@mui/material/styles";
import {createStyles, makeStyles} from "@mui/styles";
import clsx from "clsx";

const defaultTheme = createTheme();
const useStyles = makeStyles(
    (theme) =>
        createStyles({
            root: {
                border: `1px solid ${theme.palette.divider}`,
                position: "relative",
                overflow: "hidden",
                width: "100%",
                height: 26,
                borderRadius: 2
            },
            value: {
                position: "absolute",
                lineHeight: "24px",
                width: "100%",
                display: "flex",
                justifyContent: "center"
            },
            bar: {
                height: "100%",
                "&.low": {
                    backgroundColor: "#f44336"
                },
                "&.medium": {
                    backgroundColor: "#efbb5aa3"
                },
                "&.high": {
                    backgroundColor: "#088208a3"
                }
            }
        }),
    {defaultTheme}
);

const ProgressBar = React.memo(function ProgressBar(props) {
    const {value} = props;
    const valueInPercent = value * 100;
    let label = '';
    if (valueInPercent > 0) {
        label = `${valueInPercent.toLocaleString()}%`;
    } else {
        if (value < -10.0) {
            label = `${Math.trunc(value)}x`;
        } else {
            label = `${Math.round(value * 10) / 10}x`;
        }
    }
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <div
                className={classes.value}
            >{label}</div>
            <div
                className={clsx(classes.bar, {
                    low: valueInPercent < 0,
                    high: valueInPercent >= 0
                })}
                style={{maxWidth: `${value > 0 ? valueInPercent : (-value)}%`}}
            />
        </div>
    );
});

export function renderProgress(params) {
    return <ProgressBar value={Number(params.value)}/>;
}
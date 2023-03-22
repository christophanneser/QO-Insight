import QueryPlan from '../graphs/tree/QueryPlan';
import {Grid, Dialog, Switch, Paper, Chip} from '@mui/material';
import React from 'react'
import './styles.css';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const QueryPlanTrees = ({
                          query1Info,
                          query2Info,
                          queryPlan1,
                          queryPlan2,
                          idOver,
                          setIdOver,
                          sameJoinOrder,
                          closeQueryPlanDiffView,
                          showActualRows,
                          handleChangeShowActualRows,
                          maxRows,
                        }) => {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
    closeQueryPlanDiffView();
  };

  React.useEffect(() => {
    setOpen(!!(queryPlan1 && queryPlan2))
  }, [queryPlan1, queryPlan2])

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      id="my_tooltipdiv"
    >
      <Grid container spacing={0} style={{width: '100%'}}>
        <Grid
          item
          xs={6}
          style={{
            height: '100vh',
            overflow: 'hidden',
            borderRight: 'solid'
          }}
        >
          {query1Info && (
            <div className="queryInfo">
              <Grid container
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
              >
                <Grid item xs="5">
                  <h3>
                    Query {query1Info.query} - Query Plan {query1Info.id}
                  </h3>
                  {query1Info.disabled_rules.length > 0 ? (
                   <div> Hint-Set (disabled rules)</div>
                  ) : (
                    <div>Default plan</div>
                  )}
                  {query1Info.disabled_rules.map((r, index) => (
                    <div key={index}>- {r}</div>
                  ))}
                </Grid>
              </Grid>
            </div>
          )}

          {
            queryPlan1 &&

            <QueryPlan
              side={'left'}
              plan={queryPlan1}
              idOver={idOver}
              setIdOver={setIdOver}
              maxRows={maxRows}
              showActualRows={showActualRows}
            />
          }
        </Grid>
        <Grid
          item
          xs={6}
          style={{
            height: '100vh',
            overflow: 'hidden',
            width: '100%',
            borderLeft: 'solid'
          }}
        >
          {query2Info &&
            <div className="queryInfo">
              <Grid container
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
              >
                <Grid item xs="5">
                    <h3>
                      Query {query2Info.query} - Query Plan {query2Info.id}
                    </h3>
                    {query2Info.disabled_rules.length > 0 ? (
                      <div> Hint-Set (disabled rules)</div>
                    ) : (
                      <div>Default plan</div>
                    )}
                    {query2Info.disabled_rules.map((r, index) => (
                      <div key={index}>- {r}</div>
                    ))}
                </Grid>
                <Grid item xs="5">
                  <Grid container justifyContent="flex-center" direction="column"
                        alignItems="center">
                    <Grid item xs>
                      <Paper variant={"outlined"} elevation={10} zIndex={100} style={{
                        padding: 10,
                        variant: "outlined",
                        border: "1px solid black"
                      }}>
                        <Grid container spacing={1}
                              direction="column"
                              alignItems="center"
                              justifyContent="center">
                          <Grid item xs={12}>
                            Plan Rows
                            <Switch
                              checked={showActualRows}
                              onChange={handleChangeShowActualRows}
                            />
                            Actual Rows
                          </Grid>
                          <Grid item xs/>
                          <Grid item xs>
                            {sameJoinOrder ?
                              <Chip icon={<CheckCircleIcon/>} color={"success"} label={"Same Join Order"}/> :
                              <Chip icon={<CancelIcon/>} color={"error"} label={"Different Join Order"}/>}
                          </Grid>
                          <Grid item xs/>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </div>
          }
          {
            queryPlan2 &&
            <QueryPlan
              side={'right'}
              plan={queryPlan2}
              idOver={idOver}
              setIdOver={setIdOver}
              maxRows={maxRows}
              showActualRows={showActualRows}
            />
          }
        </Grid>
      </Grid>
    </Dialog>
  )
}

export default QueryPlanTrees

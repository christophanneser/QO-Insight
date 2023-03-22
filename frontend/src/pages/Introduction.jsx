import React, {useState} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from "@mui/material/Typography";
import {
  Avatar,
  Card,
  CardActionArea, CardContent, CardMedia,
  Grid,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Slide
} from "@mui/material";
import {styled} from "@mui/material/styles";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import CodeIcon from "@mui/icons-material/Code";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} />;
});


const Item = styled(Paper)(({theme, textAlign, borderColor}) => ({
  borderRadius: 10,
  variant: "outlined",
  borderColor: borderColor,
  backgroundColor: '#FFFFFF',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: textAlign,
  color: theme.palette.text.primary,
}));

function Citation({id, authors, title, conference, link}) {
  return (
    <Grid item xs={12}>
      <Item textAlign={'left'} variant={'outlined'}>
        <Link href={link} underline="hover">
          <Typography variant={'h5'}>
            [{id}] {authors}
            <b><i> {title} </i></b>
            {conference}
          </Typography>
        </Link>
      </Item>
    </Grid>
  )
}

const steps = [
  {
    label: 'QO-Insight',
    content:
      (
        <Box align="center" alignItems='center' justifyContent='center'>
          <Typography variant="h4" align="center" gutterBottom sx={{width: '90%'}}>
            <q>QO-Insight is an interactive visualization and exploration tool for<br/>
              <Box fontWeight='fontWeightMedium' display='inline'>database admins </Box>
              and
              <Box fontWeight='fontWeightMedium' display='inline'> query optimization experts</Box>.</q>
            <br/>

          </Typography>
          <Typography variant="h5" align="center" gutterBottom sx={{width: '90%'}}>
            As of now, QO-Insight is a research prototype currently under development and it supports PostgreSQL only.
            In this and the following windows, we provide background information about QO-Insight and it's research.
          </Typography>
          <br/>
          <br/>
          <List sx={{width: '90%', fontVariant: 'h5'}}>
            <Divider variant="inset" component="li"/>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar alt="Admin"/>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <React.Fragment>
                    <Typography
                      sx={{display: 'inline'}}
                      component="span"
                      variant="h5"
                      color="text.primary"
                    >
                      <b>QO-Insight for Database Admins:</b>
                    </Typography>
                  </React.Fragment>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      sx={{display: 'inline', fontStyle: 'italic'}}
                      component="span"
                      variant="h5"
                      color="text.primary"
                    >
                      <q>
                        As a database admin, I can use QO-Insight to tune an existing query optimizer towards better
                        query plans.
                        For each query, I can display different query plans and assess them based on a custom cost
                        function.
                        It can include the execution plan's latency, the number of IO page
                        accesses, the plan's memory footprint, and the total number of procssed rows.
                        This helps me to decide which query plan performs best.
                      </q>
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li"/>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>
                  <CodeIcon></CodeIcon>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <React.Fragment>
                    <Typography
                      sx={{display: 'inline'}}
                      component="span"
                      variant="h5"
                      color="text.primary"
                    >
                      <b>QO-Insight for Query Optimization Experts and Database Developers:</b>
                    </Typography>
                  </React.Fragment>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      sx={{display: 'inline', fontStyle: 'italic'}}
                      component="span"
                      variant="h5"
                      color="text.primary"
                    >
                      <q>
                        Query optimizers are highly complex systems and they use magic numbers in many places, e.g.,
                        thresholds that define when to use index scans or nested loop joins.
                        Therefore, as a database developer, I am interested in workloads and queries for which these
                        thresholds and the optimizer's rewrite rules in general perform poorly.
                        QO-Insight helps me to define a custom metric that assigns query plans different scores and
                        directly shows me counter examples, e.g. query plans that could be improved by changing the
                        internal query optimizer's implementation and it's magic numbers.
                      </q>
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li"/>
          </List>
        </Box>
      )
  },
  {
    label: 'Background',
    content:
      (
        <Box margin={2} align="center" alignItems='center' justifyContent='center'>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant={'h3'}>
                Steering Query Optimizers
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Item variant={'outlined'} borderColor={'#AAA'}>
                <Typography variant="h4" align="left" gutterBottom sx={{width: '95%'}}>
                  Databases usually optimize query plans following a cost-based, a rule-based, or a combination of both
                  strategies.
                  <br/><br/>
                  <b>Rule-based optimizers</b> implement so-called rewrite rules that transform query plans according to
                  pre-defined heuristics.
                  These heuristics have a positive impact on the optimization of many queries, however,
                  they <i>can</i> also negatively impact the performance of other queries.
                  <br/><br/>
                  For this reason, database systems usually expose <i>knobs</i> to allow <i>database admins</i> to
                  deactivate the rewrite rules in such cases.
                  <br/><br/>
                  In 2021, the <i>so-called steering approach</i> introduced in [1] uses tree convolutional neural
                  networks (TCNN) to learn what knobs should be deactivated for which queries.
                  Deactivated knobs are summarized in so-called <i>hint-sets</i> and are used to let the database system
                  generate alternative query plans,
                  as illustrated in the following figure:
                </Typography>
              </Item>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardActionArea>
                  <CardMedia
                    component="img"
                    image="/bao.png"
                    alt="green iguana"
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      Overview of the Bandit optimizer (Bao) [1].
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      The Bandit optimizer steers existing query optimizers by using so-called hint-sets to create
                      alternative execution plans.
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Item variant={'outlined'} borderColor={'#800'}>
                <Typography variant="h4" align="left" gutterBottom sx={{width: '95%'}}>
                  Since first introduced in [1], the steering approach has been topic of other research projects (e.g.
                  [2] and [3]).
                  However, while this approach yields significant performance gains (e.g. up to 90% reduction in tail
                  latency [2]),
                  it is often unclear <i>why</i> the alternative query plans perform so better than the default.
                  <br/>
                  <br/>
                  <b>Problem: </b> Evaluating and comparing query plans (that potentially join tens or hundreds of
                  relations) is time consuming and non-trivial.
                </Typography>
              </Item>
            </Grid>
            <Grid item xs={12}>
              <Item variant={'outlined'} borderColor={'#090'}>
                <Typography variant="h4" align="left" gutterBottom sx={{width: '95%'}}>
                  <b>Solution:</b> QO-Insight allows researchers, database admins, and query optimization experts to
                  easily explore and
                  better understand what hint-sets improve which queries.
                </Typography>
              </Item>
            </Grid>
            <Grid item xs={12}>
              <Typography variant={'h4'} align={'left'}>Sources:</Typography>
            </Grid>
            <Citation
              id={1}
              authors={'Ryan Marcus, Parimarjan Negi, Hongzi Mao, Nesime Tatbul, Mohammad Alizadeh, and Tim Kraska. 2021.'}
              title={'Bao: Making Learned Query Optimization Practical.'}
              conference={'In ACM SIGMOD Conference. 1275 - 1288.'}
              link={"https://dl.acm.org/doi/pdf/10.1145/3448016.3452838"}
            />
            <Citation
              id={2}
              authors={'Parimarjan Negi, Matteo Interlandi, Ryan Marcus, Mohammad Alizadeh, Tim Kraska, Marc Friedman, and Alekh Jindal. 2021.'}
              title={'Steering Query Optimizers: A Practical Take on Big Data Workloads.'}
              conference={'In ACM SIGMOD Conference. 2557 - 2569.'}
              link={"https://dl.acm.org/doi/10.1145/3448016.3457568"}
            />
            <Citation
              id={3}
              authors={'Wangda Zhang, Matteo Interlandi, Paul Mineiro, Shi Qiao, Nasim Ghazanfari, Karlen Lie, Marc T. Friedman, Rafah Hosn, Hiren Patel, and Alekh Jindal. 2022.'}
              title={'Deploying a Steered Query Optimizer in Production at Microsoft'}
              conference={'In ACM SIGMOD Conference. 2299 - 2311.'}
              link={"https://dl.acm.org/doi/abs/10.1145/3514221.3526052"}
            />
            <br/>
          </Grid>
        </Box>
      )
  },
  {
    label: 'System',
    content:
      (
        <Box margin={20} mt={2} align="center" alignItems='center' justifyContent='center'>
          <Typography variant={'h3'}>
            coming soon ...
          </Typography>
        </Box>
      )
  },
  {
    label: 'DB Admin',
    content:
      (
        <Box margin={20} mt={2} align="center" alignItems='center' justifyContent='center'>
          <Typography variant={'h3'}>
            coming soon ...
          </Typography>
        </Box>
      )
  },
  {
    label: 'DB Expert',
    content:
      (
        <Box margin={20} mt={2} align="center" alignItems='center' justifyContent='center'>
          <Typography variant={'h3'}>
            coming soon ...
          </Typography>
        </Box>
      )
  },
  {
    label: 'Data',
    content:
      (
        <Box margin={20} mt={2} align="center" alignItems='center' justifyContent='center'>
          <Typography variant={'h3'}>
            coming soon ...
          </Typography>
        </Box>
      )
  },
]

export default function IntroductionDialog({open, setOpen}) {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleStep = (step) => () => {
    setActiveStep(step);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Dialog
        TransitionComponent={Transition}
        fullWidth={true}
        maxWidth={'xl'}
        minHeight={400}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>
          <Typography variant="h3" align="center" gutterBottom>
            Welcome to QO-Insight!
          </Typography>
          <Stepper nonLinear activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepButton color="inherit" onClick={handleStep(index)}>
                  <Typography variant={'h5'}>
                    {label.label}
                  </Typography>
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </DialogTitle>
        <DialogContent dividers>
          <br/>
          <Box sx={{
            alignItems: 'center', justifyContent: 'center', minHeight: 800, maxHeight: 800
          }}>
            <React.Fragment>
              {steps[activeStep].content}
            </React.Fragment>
            <br/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error" onClick={handleClose} size="medium">Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

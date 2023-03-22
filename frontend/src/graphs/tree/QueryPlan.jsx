import React, {useEffect} from 'react';
import Tree from 'react-d3-tree';
import Latex from 'react-latex-next';
import {linkHorizontal, linkVertical} from 'd3-shape';
import './styles.css';
import './custom-tree.css';
import './custom-links.css';
import useStore from '../../store';
import * as d3 from "d3";
import Typography from "@mui/material/Typography";

const relationalAlgebraIcons = {
  'Aggregate': "$$\\Gamma \\footnotesize Aggregate$$",
  'Aggregate(FINAL)': "$$\\Gamma_{FINAL}$$",
  'Aggregate(PARTIAL)': "$$\\Gamma_{PARTIAL}$$",
  'Bitmap Heap Scan': "$$\\footnotesize BH.Scan$$",
  'Bitmap Index Scan': "$$\\vartriangle \\footnotesize BI.Scan$$",
  'CTE Scan': "$$CTE Scan$$",
  'Gather Merge': "$$\\delta \\; \\footnotesize GMerge$$",
  'LocalMerge': "$$\\delta \\; \\footnotesize LocalMerge$$",
  'Gather': "$$\\delta \\; \\footnotesize Gather$$",
  'Hash Join': "$$\\Join \\footnotesize Hash$$",
  'LeftJoin': "$$\\Join \\footnotesize Left$$",
  'Hash': "$$\\lambda \\; \\footnotesize Hash$$",
  'Incremental Sort': "$$Inc. Sort$$",
  'Index Only Scan': "$$ios$$",
  'Index Scan': "$$\\vartriangle \\footnotesize Index Scan$$",
  'IndexOnlyScan': "$$\\footnotesize Index Only Scan$$",
  'InnerJoin': "$$\\bowtie_{Inner}$$",
  'CrossJoin': "$$\\times$$",
  'EnforceSingleRow': "$$!SingleRow$$",
  'Limit': "$$\\footnotesize Limit$$",
  'LocalExchange': "$$\\Downarrow \\Uparrow$$",
  'Materialize': "$$\\Box\\;\\footnotesize Material$$",
  'Memoize': "$$\\pi \\; \\footnotesize Memoize$$",
  'Merge Join': "$$\\Join \\footnotesize Merge$$",
  'Nested Loop': "$$\\Join \\footnotesize NL$$",
  'Output': "$$\\delta_{Output}$$",
  'Project': "$$\\Pi$$",
  'RemoteStreamingExchange': "$$\\Uparrow\\Downarrow$$",
  'ScanProject': "$$\\footnotesize Scan\\; Project$$",
  'TableScan': "$$\\footnotesize Table\\;Scan$$",
  'Seq Scan': "$$\\triangleright \\; \\footnotesize SeqScan$$",
  'Sort': "$$\\footnotesize  Sort$$",
  'PartialSort': "$$\\footnotesize  Partial \\; Sort$$",
  'Subquery Scan': "$$\\footnotesize Subquery Scan$$",
  'TopN': '$$\\footnotesize TopN$$',
  'ScanFilterProject': '$$\\tiny ScanFilterProject$$',
  'TopNPartial': '$$\\footnotesize TopN\\; Partial$$',
  'RemoteStreamingMerge': '$$\\footnotesize RS-Merge$$',
};

const MAXLENGTH = 16;

function buildString(str) {
  let arr = str.split(/[_,:]/);
  let lines = 1;
  let result = "\\textbf{\\textit{" + arr[0];
  let current_length = result.length;
  for (let i = 1; i < arr.length; i++) {
    if (current_length + arr[i].length > MAXLENGTH) {
      result += "}}\\\\\\textbf{\\textit{";
      lines += 1;
      current_length = arr[i].length;
    } else {
      result += "~";
      current_length += (arr[i].length + 1);
    }
    result += arr[i];
  }
  result += "}}"
  return [result, lines];
}

function getNodeLabel(database, nodeDatum) {
  // Presto
  if (database === 'presto') {
    if (nodeDatum.nodeName.startsWith('Aggregate(PARTIAL)')) {
      nodeDatum.nodeName = 'Aggregate(PARTIAL)'
    } else if (nodeDatum.nodeName.startsWith('Aggregate(FINAL)')) {
      nodeDatum.nodeName = 'Aggregate(FINAL)'
    }
    if (!(nodeDatum.nodeName in relationalAlgebraIcons)) {
      console.log('Unknown node name detected: ', nodeDatum.nodeName);
    }
    let containsTableName = /connectorHandle='([^,]*)'/gm;
    let matches = containsTableName.exec(nodeDatum.nodeData.identifier)
    if (matches != null) {
      let [relationName, lines] = buildString(matches[1]);
      let relAlgSymbol = relationalAlgebraIcons[nodeDatum.nodeName];
      let text = relAlgSymbol.substring(0, relAlgSymbol.length - 2) + "\\\\\\footnotesize \\newcommand{\\baselinestretch}{0.1} " + relationName + "$$"
      return [<Latex strict={false}>{text}</Latex>, lines + 1]
    }

    return [<Latex strict={false}>{relationalAlgebraIcons[nodeDatum.nodeName]}</Latex>, 1]
  }

  // Postgres
  if (nodeDatum.relationName == null) {
    return [<Latex strict={false}>{relationalAlgebraIcons[nodeDatum.nodeName]}</Latex>, 1]
  } else {
    let [relationName, lines] = buildString(nodeDatum.relationName);
    let relAlgSymbol = relationalAlgebraIcons[nodeDatum.nodeName];
    let text = relAlgSymbol.substring(0, relAlgSymbol.length - 2) + "\\\\\\footnotesize \\newcommand{\\baselinestretch}{0.1} " + relationName + "$$"
    return [<Latex strict={false}>{text}</Latex>, lines + 1]
  }
}


function QueryPlan({side, plan, idOver, setIdOver, maxRows, showActualRows}) {
  let counter = 0;
  const store = useStore();
  const ref = React.useRef(null)

  const createNodePresto = (node) => {
    const details = node.details.split('\n').filter(detail => detail.trim() !== '');
    const id = node.id;
    const name = `${node.name} (${details[0]})`;
    const nodeName = node.name;
    const children = node.children.map(createNodePresto);

    return {
      id,
      name,
      nodeName,
      details,
      children,
      nodeData: node,
      relationName: 'Relation Name' in node ? node['Relation Name'] : null,
      matched: node.Matched,
      matchId: node.MatchId,
      className: node.Matched ? 'node__matched' : node.Matched === undefined ? 'node__standard' : 'node__unmatched'
    };
  };

  let getPostgresRelationName = (node) => {
    if ('Relation Name' in node) {
      return node['Relation Name'];
    }
    if ('Index Name' in node) {
      return node['Index Name'];
    }
    return null;
  };
  const createNodePostgres = (node) => {
    counter += 1;
    return {
      id: counter,
      name: `${node['Node Type']} (${node['Actual Rows']})`,
      nodeName: node['Node Type'],
      relationName: getPostgresRelationName(node),
      nodeData: node,
      showNodeData: false,
      children: node.Plans ? node.Plans.map(createNodePostgres) : [],
      matched: node.Matched,
      matchId: node.MatchId,
      className: node.Matched ? 'node__matched' : node.Matched === undefined ? 'node__standard' : 'node__unmatched'
    };
  };
  const [nodesPlan, setNodesPlan] = React.useState(store.database === "postgres" ? createNodePostgres(plan) : createNodePresto(plan));

  useEffect(() => {
    setNodesPlan(store.database === "postgres" ? {...createNodePostgres(plan)} : {...createNodePresto(plan)});
  }, [plan, showActualRows]);

  const nodeSize = {x: 125, y: 150};

  function renderForeignObjectNode({nodeDatum, foreignObjectProps, foreignObjectTextProps,}) {

    const [nodeLabel, lines] = getNodeLabel(store.database, nodeDatum);
    return (
      <g
        className={nodeDatum.matchId === idOver ? 'node__over' : nodeDatum.className}
        onMouseDownCapture={(event) => {
          //console.log('mouse clicked!');
        }
        }
        onMouseOver={(event) => {
          if (nodeDatum.matched) {
            setIdOver(nodeDatum.matchId)
          }

          // Create the tooltip
          let the_node_tooltip = d3.select("#my_tooltipdiv")
            .append('tooltipwindow' + side)
            .style("position", "absolute")
            .style('visibility', 'hidden')
            .style("background-color", nodeDatum.matched ? "#1976D2" : "#D32F2F")
            .style("color", nodeDatum.matched ? "#000000" : "#FFFFFF")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .text('');

          // Place the tooltip
          the_node_tooltip
            .style("top", (event.nativeEvent.pageY - 20) + "px")
            .style("left", (event.nativeEvent.pageX + 20) + "px")
            .style('visibility', 'visible')
            .html(`<b>${nodeDatum.nodeData['Node Type']}</b></br> - <i>Plan Rows: ${nodeDatum.nodeData['Plan Rows'].toLocaleString()}</i></br> - <i>Actual Rows: ${nodeDatum.nodeData['Actual Rows'].toLocaleString()}</i></br> - <i>Total Time: ${nodeDatum.nodeData['Actual Total Time'].toLocaleString()}</i></br> - <i>Total Cost: ${nodeDatum.nodeData['Total Cost'].toLocaleString()}</i>`)
        }}
        onMouseOut={() => {
          // Remove the tooltip
          setIdOver(-1);
          d3.selectAll("tooltipwindow" + side).remove();
        }
        }
        onMouseMove={(event) => {
          // Move the tooltip
          d3.select("tooltipwindow" + side)
            .style("top", (event.nativeEvent.pageY - 20) + "px")
            .style("left", (event.nativeEvent.pageX + 20) + "px");
        }
        }
      >
        <rect width={nodeSize.x - 20} height={nodeSize.y - 120 + (21 * (lines - 1))} x={-50} y={-15} rx={8}
              ry={8}/>
        <foreignObject {...foreignObjectProps} >
          {
            nodeDatum.matched ?
              <Typography sx={{color: "black"}}>{nodeLabel}</Typography>
              :
              <Typography sx={{color: "white"}}>{nodeLabel}</Typography>
          }
        </foreignObject>
        <foreignObject
          x={1000}
          {...foreignObjectTextProps}
        >
        </foreignObject>
      </g>
    );
  }

  const foreignObjectProps = {
    width: nodeSize.x, height: nodeSize.y, x: -62.5, y: -28,
  };
  const foreignObjectTextProps = {
    width: nodeSize.x, height: nodeSize.y, x: -40, y: -40,
  };

  const straightPathFunc = (linkDatum, orientation) => {
    const {source, target} = linkDatum;
    let vertical_link = linkVertical()({
      source: [source.x, source.y],
      target: [target.x, target.y],
    });
    return orientation === 'horizontal'
      ? linkHorizontal()({
        source: [source.y, source.x],
        target: [target.y, target.x],
      })
      : vertical_link;
  };

  const getDynamicPathClassPostgres = ({source, target}, orientation) => {
    // We defined 100 different link widths in the css file
    let property = 'Plan Rows';
    if (showActualRows) {
      property = 'Actual Rows';
    }
    let rows = target.data.nodeData[property]
    let relative_row = Math.floor((rows / maxRows) * 100);
    relative_row = relative_row > 100 ? 100 : relative_row;
    return 'link-' + relative_row.toString();
  };

  const getDynamicPathClassPresto = ({source, target}, orientation) => {
    // We defined 100 different link widths in the css file
    return 'link-25';
  };

  const linkHover = (sourceNode, targetNode, event) => {
  }

  return (
    <div className="parent-container" ref={ref}>
      {ref && ref.current && ref.current.offsetWidth &&
        <div className="parent-container">
          < Tree
            data={{...nodesPlan}}
            onClick={(n) => console.log('clicked', ref.current.offsetWidth)}
            onLinkMouseOver={linkHover}
            nodeSize={nodeSize}
            orientation=" vertical"
            translate={{x: ref.current.offsetWidth * 0.25, y: ref.current.offsetHeight * 0.1}}
            initialDepth={90}
            depthFactor={140}
            width="100%"
            height="100%"
            rootNodeClassName="node__root"
            //branchNodeClassName="node__branch"
            separation={{siblings: 1, nonSiblings: 1}}
            scaleExtent={{min: 0.3, max: 20}}
            renderCustomNodeElement={(rd3tProps) => renderForeignObjectNode(
              {...rd3tProps, foreignObjectProps, foreignObjectTextProps},
            )}
            pathFunc={straightPathFunc}//"diagonal"
            pathClassFunc={store.database === "postgres" ? getDynamicPathClassPostgres : getDynamicPathClassPresto}
            linkSvgShape={{
              shape: 'path',
              shapeProps: {
                strokeWidth: 20, // specify the line width here
              },
            }}
          />
        </div>
      }
    </div>
  );
}

export default QueryPlan;

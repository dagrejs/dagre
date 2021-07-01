const data = {
  nodes: [
    { id: "kspacey", label: "Kevin Spacey", width: 144, height: 100 },
    { id: "swilliams", label: "Saul Williams", width: 160, height: 100 },
    { id: "bpitt", label: "Brad Pitt", width: 308, height: 100 },
    { id: "hford", label: "Harrison Ford", width: 168, height: 100 },
    { id: "lwilson", label: "Luke Wilson", width: 144, height: 200 },
    { id: "kbacon", label: "Kevin Bacon", width: 121, height: 100 },
  ],
  edges: [
    { source: "kspacey", target: "swilliams" },
    { source: "swilliams", target: "kbacon" },
    { source: "bpitt", target: "kbacon" },
    { source: "hford", target: "lwilson" },
    { source: "lwilson", target: "kbacon" },
  ],
};

const issueData = {
  nodes: [
    {
      id: "node44-1623317640336",
      name: "开始",
    },
    {
      id: "node45-1623317640336",
      name: "商品类型组合产品条件节点",
    },
    {
      id: "node1621480359381",
      mockId: "node1621480359381",
      mergePointMark: "node1621480359381",
      name: "合并节点",
    },
    {
      id: "mergeNode11-1623317640335",
      name: "渠道数量库存产品赋值节点",
    },
    {
      id: "node12-1623317640335",
      name: "固定价格产品赋值节点",
    },
    {
      id: "node13-1623317640335",
      name: "风控产品赋值节点",
    },
    {
      id: "node14-1623317640335",
      name: "自提交付条件节点",
    },
    {
      id: "node1621480659309",
      mockId: "node1621480659309",
      mergePointMark: "node1621480659309",
      name: "合并节点",
    },
    {
      id: "mergeNode1-1623317640335",
      name: "同城交付条件节点",
    },
    {
      id: "node1621481018522",
      mockId: "node1621481018522",
      mergePointMark: "node1621481018522",
      name: "合并节点",
    },
    {
      id: "mergeNode33-1623317640336",
      name: "快递交付条件节点",
    },
    {
      id: "node1621481114525",
      mockId: "node1621481114525",
      mergePointMark: "node1621481114525",
      name: "合并节点",
    },
    {
      id: "mergeNode6-1623317640335",
      name: "多网点产品条件节点",
      dataType: "bos_rule_diamond",
    },
    {
      id: "node1621481184692",
      mockId: "node1621481184692",
      mergePointMark: "node1621481184692",
      name: "合并节点",
      isMergeNode: true,
    },
    {
      id: "mergeNode23-1623317640336",
      name: "附加费产品条件节点",
    },
    {
      id: "node1621481393450",
      mockId: "node1621481393450",
      mergePointMark: "node1621481393450",
      name: "合并节点",
      isMergeNode: true,
    },
    {
      id: "mergeNode28-1623317640336",
      name: "海淘关税产品条件节点",
    },
    {
      id: "node1622879617623",
      mockId: "node1622879617623",
      mergePointMark: "node1622879617623",
      name: "合并节点",
      isMergeNode: true,
    },
    {
      id: "mergeNode38-1623317640336",
      name: "店铺能力产品赋值节点",
    },
    {
      id: "branchnode30-1623317640336",
      isBranch: true,
      conditionNodeId: "mergeNode28-1623317640336",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "海淘关税产品条件集",
    },
    {
      id: "branchnode32-1623317640336",
      isBranch: true,
      position: 1,
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非海淘关税产品条件集",
      desc: "0",
    },
    {
      id: "node29-1623317640336",
      name: "海淘关税产品赋值节点",
    },
    {
      id: "node31-1623317640336",
      name: "储值卡能力产品赋值节点",
    },
    {
      id: "branchnode25-1623317640336",
      isBranch: true,
      conditionNodeId: "mergeNode23-1623317640336",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "附加费产品条件集",
      desc: "1",
    },
    {
      id: "branchnode27-1623317640336",
      isBranch: true,
      conditionNodeId: "mergeNode23-1623317640336",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非附加费产品条件集",
      desc: "0",
    },
    {
      id: "node24-1623317640336",
      name: "附加费产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node26-1623317640336",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "branchnode8-1623317640335",
      isBranch: true,
      conditionNodeId: "mergeNode6-1623317640335",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "多网点产品条件集",
      desc: "1",
    },
    {
      id: "branchnode10-1623317640335",
      isBranch: true,
      conditionNodeId: "mergeNode6-1623317640335",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非多网点产品条件集",
      desc: "0",
    },
    {
      id: "node7-1623317640335",
      name: "多网点产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node9-1623317640335",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "branchnode35-1623317640336",
      isBranch: true,
      conditionNodeId: "mergeNode33-1623317640336",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "快递交付条件集",
      desc: "result",
    },
    {
      id: "branchnode37-1623317640336",
      isBranch: true,
      conditionNodeId: "mergeNode33-1623317640336",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非快递交付条件集",
      desc: "none",
    },
    {
      id: "node34-1623317640336",
      name: "快递交付产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node36-1623317640336",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "branchnode3-1623317640335",
      isBranch: true,
      conditionNodeId: "mergeNode1-1623317640335",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "同城交付条件集",
      desc: "result",
    },
    {
      id: "branchnode5-1623317640335",
      isBranch: true,
      conditionNodeId: "mergeNode1-1623317640335",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非交付同城条件集",
      desc: "none",
    },
    {
      id: "node2-1623317640335",
      name: "同城交付产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node4-1623317640335",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "branchnode16-1623317640335",
      isBranch: true,
      conditionNodeId: "node14-1623317640335",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "自提交付条件集",
      desc: "result",
    },
    {
      id: "branchnode18-1623317640335",
      isBranch: true,
      conditionNodeId: "node14-1623317640335",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非交付自提条件集",
      desc: "none",
    },
    {
      id: "node15-1623317640335",
      name: "自提交付产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node17-1623317640335",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "combine-node2230-1623313479512",
      mockId: "combine-node2230-1623313479512",
      mergePointMark: "combine-node2230-1623313479512",
      name: "合并节点",
      isMergeNode: true,
      dataType: "bos_rule_rect",
    },
    {
      id: "mergeNode39-1623317640336",
      name: "分销产品条件节点",
      dataType: "bos_rule_diamond",
    },
    {
      id: "branchnode41-1623317640336",
      isBranch: true,
      conditionNodeId: "mergeNode39-1623317640336",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "分销商品产品条件集",
    },
    {
      id: "branchnode43-1623317640336",
      isBranch: true,
      conditionNodeId: "mergeNode39-1623317640336",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非分销商品产品条件集",
    },
    {
      id: "node40-1623317640336",
      name: "分销商品产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node42-1623317640336",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node52-1623317640336",
      name: "普通虚拟商品渠道数量产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node53-1623317640336",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node54-1623317640336",
      name: "储值卡能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node55-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node58-1623317640336",
      name: "付费券渠道数量产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node59-1623317640336",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node60-1623317640336",
      name: "储值卡能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node61-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node64-1623317640336",
      name: "渠道课程条件节点",
      dataType: "bos_rule_diamond",
      allBranchs: [
        {
          alias: "",
          assemblyType: "AND",
          children: [
            {
              assemblyType: "AND",
              children: [],
              mergePointMark: "node1623121575199",
            },
          ],
          code: "NODE_15482",
          id: "node65-1623317640336",
          name: "渠道线下课程产品赋值节点",
          nodeType: "ACTION",
          output: {
            desc: "result_off",
            id: "node66-1623317640336",
            name: "渠道线下课程条件集",
            outputs: [],
            realId: 2402,
            changed: true,
          },
          realId: 1902,
          changed: true,
        },
        {
          alias: "",
          assemblyType: "AND",
          children: [
            {
              assemblyType: "AND",
              children: [],
              mergePointMark: "node1623121575199",
            },
          ],
          code: "NODE_15480",
          id: "node67-1623317640336",
          name: "渠道线上课程产品赋值节点",
          nodeType: "ACTION",
          output: {
            desc: "result_online",
            id: "node68-1623317640336",
            name: "渠道线上课程条件集",
            outputs: [],
            realId: 2401,
            changed: true,
          },
          realId: 1901,
          changed: true,
        },
        {
          alias: "",
          assemblyType: "AND",
          children: [
            {
              assemblyType: "AND",
              children: [],
              mergePointMark: "node1623121575199",
            },
          ],
          code: "838",
          id: "node69-1623317640336",
          name: "空赋值行为节点",
          nodeType: "ACTION",
          output: {
            desc: "none",
            id: "node70-1623317640336",
            name: "渠道其他课程条件集",
            outputs: [],
            realId: 2525,
            changed: true,
          },
          realId: 838,
          changed: true,
        },
      ],
    },
    {
      id: "node1623121575199",
      mockId: "node1623121575199",
      mergePointMark: "node1623121575199",
      name: "合并节点",
      isMergeNode: true,
      dataType: "bos_rule_rect",
    },
    {
      id: "mergeNode19-1623317640335",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
    },
    {
      id: "node20-1623317640336",
      name: "固定价格产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node21-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node22-1623317640336",
      name: "储值卡能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "branchnode66-1623317640336",
      isBranch: true,
      conditionNodeId: "node64-1623317640336",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "渠道线下课程条件集",
      desc: "result_off",
    },
    {
      id: "branchnode68-1623317640336",
      isBranch: true,
      conditionNodeId: "node64-1623317640336",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "渠道线上课程条件集",
      desc: "result_online",
    },
    {
      id: "branchnode70-1623317640336",
      isBranch: true,
      conditionNodeId: "node64-1623317640336",
      position: 2,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "渠道其他课程条件集",
      desc: "none",
    },
    {
      id: "node65-1623317640336",
      name: "渠道线下课程产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node67-1623317640336",
      name: "渠道线上课程产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node69-1623317640336",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node75-1623317640336",
      name: "礼品卡渠道数量产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node76-1623317640336",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node77-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node80-1623317640336",
      name: "次卡渠道数量产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node81-1623317640336",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node82-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node85-1623317640336",
      name: "权益卡渠道数量产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node86-1623317640336",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node87-1623317640336",
      name: "储值卡能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node88-1623317640336",
      name: "权益卡会员卡产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node89-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node92-1623317640336",
      name: "付费等级渠道数量产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node93-1623317640336",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node94-1623317640336",
      name: "储值卡能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node95-1623317640336",
      name: "付费等级会员卡产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node96-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node101-1623317640336",
      name: "电子卡券原子产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node102-1623317640336",
      name: "店铺能力产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node103-1623317640336",
      name: "风控产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node104-1623317640336",
      name: "分销产品条件节点",
      dataType: "bos_rule_diamond",
      allBranchs: [
        {
          alias: "",
          assemblyType: "AND",
          children: [],
          code: "NODE_23508",
          id: "node105-1623317640336",
          name: "分销商品产品赋值节点",
          nodeType: "ACTION",
          output: {
            desc: "1",
            id: "node106-1623317640336",
            name: "分销商品产品条件集",
            outputs: [],
            realId: 3961,
            changed: true,
          },
          realId: 3366,
          changed: true,
        },
        {
          alias: "",
          assemblyType: "AND",
          children: [],
          code: "838",
          id: "node107-1623317640336",
          name: "空赋值行为节点",
          nodeType: "ACTION",
          output: {
            desc: "0",
            id: "node108-1623317640336",
            name: "非分销商品产品条件集",
            outputs: [],
            realId: 3962,
            changed: true,
          },
          realId: 838,
          changed: true,
        },
      ],
    },
    {
      id: "branchnode106-1623317640336",
      isBranch: true,
      conditionNodeId: "node104-1623317640336",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "分销商品产品条件集",
      desc: "1",
    },
    {
      id: "branchnode108-1623317640336",
      isBranch: true,
      conditionNodeId: "node104-1623317640336",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "非分销商品产品条件集",
      desc: "0",
    },
    {
      id: "node105-1623317640336",
      name: "分销商品产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node107-1623317640336",
      name: "空赋值行为节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "branchnode47-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 0,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "生鲜果蔬商品类型条件集",
    },
    {
      id: "branchnode49-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 1,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "海淘商品类型条件集",
    },
    {
      id: "branchnode51-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 2,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "普通虚拟商品类型条件集",
    },
    {
      id: "branchnode57-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 3,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "付费优惠券商品类型条件集",
    },
    {
      id: "branchnode63-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 4,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "知识付费商品类型条件集",
    },
    {
      id: "branchnode72-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 5,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "茶饮商品类型条件集",
    },
    {
      id: "branchnode74-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 6,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "礼品卡商品类型条件集",
    },
    {
      id: "branchnode79-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 7,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "次卡商品类型条件集",
    },
    {
      id: "branchnode84-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 8,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "会员卡商品类型条件集",
    },
    {
      id: "branchnode91-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 9,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "付费等级类型条件集",
    },
    {
      id: "branchnode98-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 10,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "实物商品类型条件集",
    },
    {
      id: "branchnode100-1623317640336",
      isBranch: true,
      conditionNodeId: "node45-1623317640336",
      position: 11,
      dataType: "bos_rule_branch",
      stateStyles: {},
      hasChild: true,
      isMerged: false,
      name: "电子卡券商品类型条件集",
    },
    {
      id: "node46-1623317640336",
      name: "生鲜果蔬类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node48-1623317640336",
      name: "海淘商品类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node50-1623317640336",
      name: "普通虚拟商品类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node56-1623317640336",
      name: "付费优惠券类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node62-1623317640336",
      name: "知识付费类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node71-1623317640336",
      name: "茶饮烘焙商品类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node73-1623317640336",
      name: "礼品卡类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node78-1623317640336",
      name: "次卡类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node83-1623317640336",
      name: "会员卡类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node90-1623317640336",
      name: "付费等级会员卡产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node97-1623317640336",
      name: "实物商品类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
    {
      id: "node99-1623317640336",
      name: "电子卡券商品类型组合产品赋值节点",
      dataType: "bos_rule_rect",
      allBranchs: [],
    },
  ],
  edges: [
    {
      source: "node44-1623317640336",
      target: "node45-1623317640336",
    },
    {
      source: "branchnode47-1623317640336",
      target: "node46-1623317640336",
    },
    {
      source: "node46-1623317640336",
      target: "node1621480359381",
    },
    {
      source: "node1621480359381",
      target: "mergeNode11-1623317640335",
    },
    {
      source: "mergeNode11-1623317640335",
      target: "node12-1623317640335",
    },
    {
      source: "node12-1623317640335",
      target: "node13-1623317640335",
    },
    {
      source: "node13-1623317640335",
      target: "node14-1623317640335",
    },
    {
      source: "branchnode16-1623317640335",
      target: "node15-1623317640335",
    },
    {
      source: "node15-1623317640335",
      target: "node1621480659309",
    },
    {
      source: "node1621480659309",
      target: "mergeNode1-1623317640335",
    },
    {
      source: "branchnode3-1623317640335",
      target: "node2-1623317640335",
    },
    {
      source: "node2-1623317640335",
      target: "node1621481018522",
    },
    {
      source: "node1621481018522",
      target: "mergeNode33-1623317640336",
    },
    {
      source: "branchnode35-1623317640336",
      target: "node34-1623317640336",
    },
    {
      source: "node34-1623317640336",
      target: "node1621481114525",
    },
    {
      source: "node1621481114525",
      target: "mergeNode6-1623317640335",
    },
    {
      source: "branchnode8-1623317640335",
      target: "node7-1623317640335",
    },
    {
      source: "node7-1623317640335",
      target: "node1621481184692",
    },
    {
      source: "node1621481184692",
      target: "mergeNode23-1623317640336",
    },
    {
      source: "branchnode25-1623317640336",
      target: "node24-1623317640336",
    },
    {
      source: "node24-1623317640336",
      target: "node1621481393450",
    },
    {
      source: "node1621481393450",
      target: "mergeNode28-1623317640336",
    },
    {
      source: "branchnode30-1623317640336",
      target: "node29-1623317640336",
    },
    {
      source: "node29-1623317640336",
      target: "node1622879617623",
    },
    {
      source: "node1622879617623",
      target: "mergeNode38-1623317640336",
    },
    {
      source: "branchnode32-1623317640336",
      target: "node31-1623317640336",
    },
    {
      source: "node31-1623317640336",
      target: "node1622879617623",
    },
    {
      source: "mergeNode28-1623317640336",
      target: "branchnode30-1623317640336",
    },
    {
      source: "mergeNode28-1623317640336",
      target: "branchnode32-1623317640336",
    },
    {
      source: "branchnode27-1623317640336",
      target: "node26-1623317640336",
    },
    {
      source: "node26-1623317640336",
      target: "node1621481393450",
    },
    {
      source: "mergeNode23-1623317640336",
      target: "branchnode25-1623317640336",
    },
    {
      source: "mergeNode23-1623317640336",
      target: "branchnode27-1623317640336",
    },
    {
      source: "branchnode10-1623317640335",
      target: "node9-1623317640335",
    },
    {
      source: "node9-1623317640335",
      target: "node1621481184692",
    },
    {
      source: "mergeNode6-1623317640335",
      target: "branchnode8-1623317640335",
    },
    {
      source: "mergeNode6-1623317640335",
      target: "branchnode10-1623317640335",
    },
    {
      source: "branchnode37-1623317640336",
      target: "node36-1623317640336",
    },
    {
      source: "node36-1623317640336",
      target: "node1621481114525",
    },
    {
      source: "mergeNode33-1623317640336",
      target: "branchnode35-1623317640336",
    },
    {
      source: "mergeNode33-1623317640336",
      target: "branchnode37-1623317640336",
    },
    {
      source: "branchnode5-1623317640335",
      target: "node4-1623317640335",
    },
    {
      source: "node4-1623317640335",
      target: "node1621481018522",
    },
    {
      source: "mergeNode1-1623317640335",
      target: "branchnode3-1623317640335",
    },
    {
      source: "mergeNode1-1623317640335",
      target: "branchnode5-1623317640335",
    },
    {
      source: "branchnode18-1623317640335",
      target: "node17-1623317640335",
    },
    {
      source: "node17-1623317640335",
      target: "node1621480659309",
    },
    {
      source: "node14-1623317640335",
      target: "branchnode16-1623317640335",
    },
    {
      source: "node14-1623317640335",
      target: "branchnode18-1623317640335",
    },
    {
      source: "branchnode49-1623317640336",
      target: "node48-1623317640336",
    },
    {
      source: "node48-1623317640336",
      target: "combine-node2230-1623313479512",
    },
    {
      source: "combine-node2230-1623313479512",
      target: "mergeNode39-1623317640336",
    },
    {
      source: "branchnode41-1623317640336",
      target: "node40-1623317640336",
    },
    {
      source: "node40-1623317640336",
      target: "node1621480359381",
    },
    {
      source: "branchnode43-1623317640336",
      target: "node42-1623317640336",
    },
    {
      source: "node42-1623317640336",
      target: "node1621480359381",
    },
    {
      source: "mergeNode39-1623317640336",
      target: "branchnode41-1623317640336",
    },
    {
      source: "mergeNode39-1623317640336",
      target: "branchnode43-1623317640336",
    },
    {
      source: "branchnode51-1623317640336",
      target: "node50-1623317640336",
    },
    {
      source: "node52-1623317640336",
      target: "node53-1623317640336",
    },
    {
      source: "node53-1623317640336",
      target: "node54-1623317640336",
    },
    {
      source: "node54-1623317640336",
      target: "node55-1623317640336",
    },
    {
      source: "branchnode57-1623317640336",
      target: "node56-1623317640336",
    },
    {
      source: "node58-1623317640336",
      target: "node59-1623317640336",
    },
    {
      source: "node59-1623317640336",
      target: "node60-1623317640336",
    },
    {
      source: "node60-1623317640336",
      target: "node61-1623317640336",
    },
    {
      source: "branchnode63-1623317640336",
      target: "node62-1623317640336",
    },
    {
      source: "branchnode66-1623317640336",
      target: "node65-1623317640336",
    },
    {
      source: "node65-1623317640336",
      target: "node1623121575199",
    },
    {
      source: "node1623121575199",
      target: "mergeNode19-1623317640335",
    },
    {
      source: "mergeNode19-1623317640335",
      target: "node20-1623317640336",
    },
    {
      source: "node20-1623317640336",
      target: "node21-1623317640336",
    },
    {
      source: "node21-1623317640336",
      target: "node22-1623317640336",
    },
    {
      source: "branchnode68-1623317640336",
      target: "node67-1623317640336",
    },
    {
      source: "node67-1623317640336",
      target: "node1623121575199",
    },
    {
      source: "branchnode70-1623317640336",
      target: "node69-1623317640336",
    },
    {
      source: "node69-1623317640336",
      target: "node1623121575199",
    },
    {
      source: "node64-1623317640336",
      target: "branchnode66-1623317640336",
    },
    {
      source: "node64-1623317640336",
      target: "branchnode68-1623317640336",
    },
    {
      source: "node64-1623317640336",
      target: "branchnode70-1623317640336",
    },
    {
      source: "branchnode72-1623317640336",
      target: "node71-1623317640336",
    },
    {
      source: "node71-1623317640336",
      target: "node1621480359381",
    },
    {
      source: "branchnode74-1623317640336",
      target: "node73-1623317640336",
    },
    {
      source: "node75-1623317640336",
      target: "node76-1623317640336",
    },
    {
      source: "node76-1623317640336",
      target: "node77-1623317640336",
    },
    {
      source: "branchnode79-1623317640336",
      target: "node78-1623317640336",
    },
    {
      source: "node80-1623317640336",
      target: "node81-1623317640336",
    },
    {
      source: "node81-1623317640336",
      target: "node82-1623317640336",
    },
    {
      source: "branchnode84-1623317640336",
      target: "node83-1623317640336",
    },
    {
      source: "node85-1623317640336",
      target: "node86-1623317640336",
    },
    {
      source: "node86-1623317640336",
      target: "node87-1623317640336",
    },
    {
      source: "node87-1623317640336",
      target: "node88-1623317640336",
    },
    {
      source: "node88-1623317640336",
      target: "node89-1623317640336",
    },
    {
      source: "branchnode91-1623317640336",
      target: "node90-1623317640336",
    },
    {
      source: "node92-1623317640336",
      target: "node93-1623317640336",
    },
    {
      source: "node93-1623317640336",
      target: "node94-1623317640336",
    },
    {
      source: "node94-1623317640336",
      target: "node95-1623317640336",
    },
    {
      source: "node95-1623317640336",
      target: "node96-1623317640336",
    },
    {
      source: "branchnode98-1623317640336",
      target: "node97-1623317640336",
    },
    {
      source: "node97-1623317640336",
      target: "combine-node2230-1623313479512",
    },
    {
      source: "branchnode100-1623317640336",
      target: "node99-1623317640336",
    },
    {
      source: "node101-1623317640336",
      target: "node102-1623317640336",
    },
    {
      source: "node102-1623317640336",
      target: "node103-1623317640336",
    },
    {
      source: "node103-1623317640336",
      target: "node104-1623317640336",
    },
    {
      source: "branchnode106-1623317640336",
      target: "node105-1623317640336",
    },
    {
      source: "branchnode108-1623317640336",
      target: "node107-1623317640336",
    },
    {
      source: "node104-1623317640336",
      target: "branchnode106-1623317640336",
    },
    {
      source: "node104-1623317640336",
      target: "branchnode108-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode47-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode49-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode51-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode57-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode63-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode72-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode74-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode79-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode84-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode91-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode98-1623317640336",
    },
    {
      source: "node45-1623317640336",
      target: "branchnode100-1623317640336",
    },
    {
      source: "node50-1623317640336",
      target: "node52-1623317640336",
    },
    {
      source: "node56-1623317640336",
      target: "node58-1623317640336",
    },
    {
      source: "node62-1623317640336",
      target: "node64-1623317640336",
    },
    {
      source: "node73-1623317640336",
      target: "node75-1623317640336",
    },
    {
      source: "node78-1623317640336",
      target: "node80-1623317640336",
    },
    {
      source: "node83-1623317640336",
      target: "node85-1623317640336",
    },
    {
      source: "node90-1623317640336",
      target: "node92-1623317640336",
    },
    {
      source: "node99-1623317640336",
      target: "node101-1623317640336",
    },
  ],
};
issueData.nodes.forEach((n) => {
  n.width = 20;
  n.height = 20;
});

const data1 = {
  nodes: [
    {
      id: "0",
      width: 20,
      height: 20,
    },
    {
      id: "1",
      width: 20,
      height: 20,
    },
    {
      id: "2",
      width: 20,
      height: 20,
    },
    {
      id: "3",
      width: 20,
      height: 20,
    },
    {
      id: "4",
      width: 20,
      height: 20,
    },
    {
      id: "5",
      width: 20,
      height: 20,
    },
    {
      id: "6",
      width: 20,
      height: 20,
    },
    {
      id: "7",
      width: 20,
      height: 20,
    },
    {
      id: "8",
      width: 20,
      height: 20,
    },
    {
      id: "9",
      width: 20,
      height: 20,
    },
    {
      id: "10",
      width: 20,
      height: 20,
    },
    {
      id: "11",
      width: 20,
      height: 20,
    },
    {
      id: "12",
      width: 20,
      height: 20,
    },
    {
      id: "13",
      width: 20,
      height: 20,
    },
    {
      id: "14",
      width: 20,
      height: 20,
    },
    {
      id: "15",
      width: 20,
      height: 20,
    },
    {
      id: "16",
      width: 20,
      height: 20,
    },
    {
      id: "17",
      width: 20,
      height: 20,
    },
    {
      id: "18",
      width: 20,
      height: 20,
    },
    {
      id: "19",
      width: 20,
      height: 20,
    },
    {
      id: "20",
      width: 20,
      height: 20,
    },
    {
      id: "21",
      width: 20,
      height: 20,
    },
    {
      id: "22",
      width: 20,
      height: 20,
    },
    {
      id: "23",
      width: 20,
      height: 20,
    },
    {
      id: "24",
      width: 20,
      height: 20,
    },
    {
      id: "25",
      width: 20,
      height: 20,
    },
    {
      id: "26",
      width: 20,
      height: 20,
    },
    {
      id: "27",
      width: 20,
      height: 20,
    },
    {
      id: "28",
      width: 20,
      height: 20,
    },
    {
      id: "29",
      width: 20,
      height: 20,
    },
    {
      id: "30",
      width: 20,
      height: 20,
    },
    {
      id: "31",
      width: 20,
      height: 20,
    },
    {
      id: "32",
      width: 20,
      height: 20,
    },
  ],
  edges: [
    {
      source: "20",
      target: "1",
    },
    {
      source: "21",
      target: "2",
    },
    {
      source: "22",
      target: "3",
    },
    {
      source: "23",
      target: "4",
    },
    {
      source: "1",
      target: "5",
    },
    {
      source: "2",
      target: "6",
    },
    {
      source: "3",
      target: "6",
    },
    {
      source: "4",
      target: "7",
    },
    {
      source: "5",
      target: "26",
    },
    {
      source: "26",
      target: "8",
    },
    {
      source: "6",
      target: "27",
    },
    {
      source: "27",
      target: "9",
    },
    {
      source: "27",
      target: "10",
    },
    {
      source: "7",
      target: "28",
    },
    {
      source: "28",
      target: "11",
    },
    {
      source: "8",
      target: "13",
    },
    {
      source: "9",
      target: "15",
    },
    {
      source: "15",
      target: "12",
    },
    {
      source: "10",
      target: "16",
    },
    {
      source: "16",
      target: "12",
    },
    {
      source: "11",
      target: "14",
    },
    {
      source: "0",
      target: "17",
    },
    {
      source: "0",
      target: "18",
    },
    {
      source: "17",
      target: "24",
    },
    {
      source: "24",
      target: "12",
    },
    {
      source: "18",
      target: "25",
    },
    {
      source: "25",
      target: "12",
    },
    {
      source: "0",
      target: "20",
    },
    {
      source: "0",
      target: "21",
    },
    {
      source: "0",
      target: "22",
    },
    {
      source: "0",
      target: "23",
    },
    // 下半分支
    {
      source: "0",
      target: "19",
    },
    {
      source: "0",
      target: "29",
    },
    {
      source: "0",
      target: "30",
    },
    {
      source: "0",
      target: "31",
    },
    {
      source: "0",
      target: "32",
    },
  ],
};

const testData = {
  nodes: [
    {
      id: "0",
      width: 20,
      height: 20,
    },
    {
      id: "1",
      width: 20,
      height: 20,
      // fixorder: 1,
    },
    {
      id: "2",
      width: 20,
      height: 20,
      layer: 1,
      // fixorder: 2,
    },
    {
      id: "3",
      width: 20,
      height: 20,
      // fixorder: 0,
    },
    {
      id: "4",
      width: 20,
      height: 20,
      // fixorder: 1,
    },
    {
      id: "5",
      width: 20,
      height: 20,
      // fixorder: 0,
    },
  ],
  edges: [
    {
      source: "0",
      target: "5",
    },
    {
      source: "0",
      target: "1",
    },
    {
      source: "0",
      target: "2",
    },
    {
      source: "1",
      target: "4",
    },
    {
      source: "1",
      target: "3",
    },
    {
      source: "2",
      target: "4",
    },
    {
      source: "5",
      target: "3",
    },
  ],
};

const g = createGraph(testData);

// Set an object for the graph label
g.setGraph({
  // ranker: "longest-path",
  // ranker: "tight-tree",
  ranker: "network-complex",
});

dagre.layout(g);

g.nodes().forEach(function (v) {
  console.log("Node " + v + ": " + JSON.stringify(g.node(v)));
});
g.edges().forEach(function (e) {
  console.log("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(g.edge(e)));
});

const div = document.createElement("div");
document.body.appendChild(div);
drawGraph(g, div);

function createGraph(data) {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () {
    return {};
  });

  // Add nodes to the graph. The first argument is the node id. The second is
  // metadata about the node. In this case we're going to add labels to each of
  // our nodes.
  data.nodes.forEach((n) => {
    g.setNode(n.id, n);
  });

  // Add edges to the graph.
  data.edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  return g;
}

function drawGraph(g, container) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", 1000)
    .attr("height", 1000);
  const nodes = g.nodes().map((n) => g.node(n));
  const edges = g.edges().map((e) => {
    const res = g.edge(e);
    res.source = g.node(e.v);
    res.target = g.node(e.w);
    return res;
  });

  svg
    .selectAll(".edge")
    .data(edges)
    .enter()
    .append("polyline")
    .attr("class", "edge")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("points", (d) => {
      return `${d.source.x}, ${d.source.y} ${d.points
        .map((p) => `${p.x},${p.y}`)
        .join(" ")} ${d.target.x}, ${d.target.y}`;
    });

  const node = svg
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("rect")
    .style("fill", "#aaaaaa")
    .attr("class", "node")
    .attr("x", (d) => d.x - (d.width ?? 20) / 2)
    .attr("y", (d) => d.y - (d.height ?? 20) / 2)
    .attr("width", (d) => d.width ?? 20)
    .attr("height", (d) => d.height ?? 20);

  node.append("title").text((d) => d.id);
}

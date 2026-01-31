exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      lambda: "spl_prequest_updateContent",
      success: true,
      event
    })
  };
};

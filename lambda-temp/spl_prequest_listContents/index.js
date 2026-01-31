exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      lambda: "spl_prequest_listContents",
      success: true,
      event
    })
  };
};

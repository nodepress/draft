
$(function() {
  $("a[data-method=delete]").click(function() {
    var $this = $(this);
    var confirmMessage = $this.attr("data-confirm");
    if (confirmMessage) {
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    var url = $this.attr("href");
    var data = {
      _method : "DELETE"
    };
    var xhr = $.post(url, data, function(result) {
      console.log(result);
      if (result.success) {
        window.location = "/posts/";
      } else {
        alert(result.message);
      }
    }, "json");
    return false;
  });

  $("#searchform #s").blur(function() {
    if ($(this).val() == '') {
      $(this).val('Search: type, hit enter');
    }
  }).focus(function() {
    if ($(this).val() == 'Search: type, hit enter') {
      $(this).val("");
    }
  });
});
